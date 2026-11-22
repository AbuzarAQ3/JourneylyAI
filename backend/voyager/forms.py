from django import forms
from django.urls import reverse
from .models import JourneyModel

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
        fields = [
            "title",
            "start_date",
            "end_date",
        ]
        labels = {
            "start_date": "Start date",
            "end_date": "End date",
        }
        help_texts = {
            "start_date": "When does your journey begin?",
            "end_date": "When does your journey end?",
        }
        widgets = {
            "start_date": forms.DateInput(
                format="%Y-%m-%d",
                attrs={
                    "type": "date",
                    "class": (
                        "w-full rounded-lg border border-gray-300 "
                        "bg-white px-3 py-2.5 text-sm text-gray-900 "
                        "outline-none transition "
                        "focus:border-voyager-rose "
                        "focus:ring-2 focus:ring-voyager-rose/20 "
                        "aria-[invalid=true]:border-red-500"
                    ),
                    "aria-describedby": (
                        "id_start_date_help id_start_date_errors"
                    ),
                }
            ),

            "end_date": forms.DateInput(
                format="%Y-%m-%d",
                attrs={
                    "type": "date",
                    "class": (
                        "w-full rounded-lg border border-gray-300 "
                        "bg-white px-3 py-2.5 text-sm text-gray-900 "
                        "outline-none transition "
                        "focus:border-voyager-rose "
                        "focus:ring-2 focus:ring-voyager-rose/20 "
                        "aria-[invalid=true]:border-red-500"
                    ),
                    "aria-describedby": (
                        "id_end_date_help id_end_date_errors"
                    ),
                }
            ),
        }

    def clean_title(self):
        title = self.cleaned_data.get("title", "").strip()
        return title or "Untitled"

    def clean(self):
        cleaned_data = super().clean()
        start_date = cleaned_data.get("start_date")
        end_date = cleaned_data.get("end_date")
        if start_date and end_date:
            if end_date < start_date:
                self.add_error(
                    "end_date",
                    "Journey's ending date cannot be earlier than starting date."
                )
                
        first_location = cleaned_data.get("first_location")
        latitude = cleaned_data.get("first_latitude")
        longitude = cleaned_data.get("first_longitude")

        if first_location and (latitude is None or longitude is None):
            self.add_error(
                "first_location",
                "Please select a destination from the search suggestions."
            )

        return cleaned_data