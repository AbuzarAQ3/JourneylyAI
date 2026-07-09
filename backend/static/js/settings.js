// Settings page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Preview image before upload
    const profilePicInput = document.getElementById('id_profile_pic');
    const previewPic = document.getElementById('preview-pic');

    if (profilePicInput && previewPic) {
        profilePicInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    previewPic.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    // Form validation
    const form = document.querySelector('.settings-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const username = document.querySelector('input[name="username"]');
            const fullname = document.querySelector('input[name="fullname"]');

            if (username && !username.value.trim()) {
                e.preventDefault();
                alert('Username cannot be empty');
                return;
            }

            if (fullname && !fullname.value.trim()) {
                e.preventDefault();
                alert('Full name cannot be empty');
                return;
            }
        });
    }
});
