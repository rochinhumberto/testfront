import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { Credentials } from 'src/app/interfaces/credenciales';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  creds: Credentials = {
    email: '',
    contrasena: ''
  };

  constructor(
    private service: ApiService,
    private router: Router
  ){ }

  login(form: NgForm){
    this.service.login(this.creds).subscribe(response => {
      this.router.navigate(['/']);
    });
  }
}
