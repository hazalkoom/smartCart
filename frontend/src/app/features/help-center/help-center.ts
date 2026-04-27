import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-help-center',
  standalone: false,
  templateUrl: './help-center.html',
  styleUrl: './help-center.css',
})
export class HelpCenterComponent {
  submitted = false;
  formData = {
    topic: 'general',
    name: '',
    email: '',
    message: '',
  };

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      return;
    }

    this.submitted = true;
    form.resetForm({
      topic: 'general',
      name: '',
      email: '',
      message: '',
    });
  }
}
