from django import forms
from django.urls import reverse
from datetime import datetime
from django.core.exceptions import ValidationError

from ..models import JourneyModel

class LocalDateTimeField(forms.Field):
    """
    Parses datetime-local input without applying Django's
    project timezone. The destination timezone is applied later.
    """
    widget = forms.DateTimeInput(
        format="%Y-%m-%dT%H:%M",
        attrs={"type": "datetime-local"},
    )
    
    def to_python(self, value):
        if not value:
            return None

        try:
            return datetime.strptime(value, "%Y-%m-%dT%H:%M")
        except ValueError:
            raise ValidationError("Enter a valid date and time.")
        
# voyager_studio: Quick Start Form
class QuickStartForm(forms.ModelForm):

    first_location = forms.CharField(
        max_length=150,
        strip=True,
        label="First destination",
        help_text=(
            "Enter a city or specific destination. "
            "You can add more stops inside Voyager Studio."
        ),
        widget=forms.TextInput(attrs={
            "placeholder": "e.g. Paris, France",
            "autocomplete": "off",
            "class": (
                "w-full rounded-lg border border-gray-300 "
                "bg-white px-3.5 py-2.5 text-sm text-gray-900 "
                "outline-none transition "
                "focus:border-voyager-rose "
                "focus:ring-2 focus:ring-voyager-rose/20 "
                "aria-[invalid=true]:border-red-500"
            ),
            "aria-describedby": (
                "id_first_location_help "
                "id_first_location_errors"
            ),
        })
    )

    first_latitude = forms.DecimalField(
    required=False,
    min_value=-90,
    max_value=90,
    widget=forms.HiddenInput(),
    )

    first_longitude = forms.DecimalField(
        required=False,
        min_value=-180,
        max_value=180,
        widget=forms.HiddenInput(),
    )

    DATETIME_INPUT_CLASSES = (
        "w-full rounded-lg border border-gray-300 "
        "bg-white px-3.5 py-2.5 text-xs font-light text-voyager-graphite"
        "outline-none transition "
        "focus:border-voyager-rose "
        "focus:ring-2 focus:ring-voyager-rose/20 "
        "aria-[invalid=true]:border-red-500"
    )


    first_arrival_at = forms.DateTimeField(
        required=True,
        label="Arrival at",
        input_formats=["%Y-%m-%dT%H:%M"],
        widget=forms.DateTimeInput(
            format="%Y-%m-%dT%H:%M",
            attrs={
                "type": "datetime-local",
                "class": DATETIME_INPUT_CLASSES,
            },
        ),
    )

    first_departure_at = forms.DateTimeField(
        required=True,
        label="Departure at",
        input_formats=["%Y-%m-%dT%H:%M"],
        widget=forms.DateTimeInput(
            format="%Y-%m-%dT%H:%M",
            attrs={
                "type": "datetime-local",
                "class": DATETIME_INPUT_CLASSES,
            },
        ),
    )

    title = forms.CharField(
        max_length=100,
        required=False,
        label="Journey name",
        help_text="You can rename your journey later.",
        widget=forms.TextInput(attrs={
            "placeholder": "e.g. A week in Europe",
            "class": (
                "w-full rounded-lg border border-gray-300 "
                "bg-white px-3.5 py-2.5 text-sm text-gray-900 "
                "outline-none transition "
                "focus:border-voyager-rose "
                "focus:ring-2 focus:ring-voyager-rose/20 "
                "aria-[invalid=true]:border-red-500"
            ),
            "aria-describedby": "id_title_help id_title_errors",
        })
    )

    def __init__(self, *args, **kwargs):
        
        super().__init__(*args, **kwargs)

        self.fields["first_location"].widget.attrs.update({
        "hx-get": reverse("location_search"),
        "hx-trigger": "input changed delay:350ms",
        "hx-target": "#location-suggestions",
        "hx-swap": "innerHTML",
        "hx-indicator": "#location-loading",
        "autocomplete": "off", })

        if self.is_bound:
            for name in self.fields:
                if self[name].errors:
                    self.fields[name].widget.attrs["aria-invalid"] = "true"

    class Meta:
        model = JourneyModel
        fields = ["title",]
        
    def clean_title(self):
        title = self.cleaned_data.get("title", "").strip()
        return title or "Untitled"

    def clean(self):
        cleaned_data = super().clean()
                
        location = cleaned_data.get("first_location")
        latitude = cleaned_data.get("first_latitude")
        longitude = cleaned_data.get("first_longitude")
        
        arrival = cleaned_data.get("first_arrival_at")
        departure = cleaned_data.get("first_departure_at")

        if location and (latitude is None or longitude is None):
            self.add_error(
                "first_location",
                "Select a destination from the suggestions."
            )

        if arrival and departure and departure <= arrival:
            self.add_error(
                "first_departure_at",
                "Departure must be after arrival."
            )

        return cleaned_data