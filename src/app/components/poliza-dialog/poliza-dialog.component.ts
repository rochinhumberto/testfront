import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReplaySubject, Subject, takeUntil } from 'rxjs';
import { ApiService } from 'src/app/api.service';
import { Articulo } from 'src/app/interfaces/articulo';
import { Empleado } from 'src/app/interfaces/empleado';
import { Respuestas } from 'src/app/interfaces/respuestas';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Poliza } from 'src/app/interfaces/poliza';

@Component({
  selector: 'app-poliza-dialog',
  templateUrl: './poliza-dialog.component.html',
  styleUrls: ['./poliza-dialog.component.scss']
})
export class PolizaDialogComponent implements OnInit, OnDestroy {

  form: FormGroup;
  title: string;
  res: Respuestas;
  selectedSkuAmount: number = 10;
  idPoliza = null;
  editingPoliza: Poliza;

  employees: Empleado[];
  searchEmpCtrl: FormControl = new FormControl();
  filteredEmps: ReplaySubject<Empleado[]> = new ReplaySubject<Empleado[]>(1);

  articles: Articulo[];
  searchArtCtrl: FormControl = new FormControl();
  filteredArts: ReplaySubject<Articulo[]> = new ReplaySubject<Articulo[]>(1);

  protected _onDestroy = new Subject<void>();

  constructor(
      private fb: FormBuilder,
      private dialogRef: MatDialogRef<PolizaDialogComponent>,
      private service: ApiService,
      private snackBar: MatSnackBar,
      @Inject(MAT_DIALOG_DATA) data
  ) {
    this.title = data.title;
    if(data.idPoliza){
      this.idPoliza = data.idPoliza;
    }
  }

  ngOnInit() {
    this.service.getEmpleados().subscribe(res => {
      this.res = res;
      this.employees = res.Data['Empleados']
      this.filteredEmps.next(this.employees.slice());
      // listen for search field value changes
      this.searchEmpCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.searchEmps();
      });
    });

    this.service.getArticulos().subscribe(res => {
      this.res = res;
      this.articles = res.Data['Inventario']
      this.filteredArts.next(this.articles.slice());
      // listen for search field value changes
      this.searchArtCtrl.valueChanges
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this.searchArts();
      });
    });

    this.form = this.fb.group({
      id_empleado: [null, Validators.compose([Validators.required])],
      sku: [null, Validators.compose([Validators.required])],
      cantidad: [null, Validators.compose([Validators.required])]
    });

    if(this.idPoliza){
      this.service.getPolizaById(this.idPoliza).subscribe({
        next: (response) => {
          this.editingPoliza = response.Data?.Poliza
          
          this.form = this.fb.group({
            id_empleado: [this.editingPoliza.empleado.idEmpleado, Validators.compose([Validators.required])],
            sku: [this.editingPoliza.articulo.sku, Validators.compose([Validators.required]),],
            cantidad: [this.editingPoliza.cantidad, Validators.compose([Validators.required])]
          });

          this.form.controls['sku'].disable();
        },
        error: (e) => {
          console.log(e);
          this.snackBar.open('Error al obtener datos de poliza', '',{ duration: 2000 });
        },
      });
    }
  }

  ngOnDestroy() {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  save() {
    if(this.form.valid){
      const body = this.form.getRawValue();
      const selectedArticle = this.articles.filter(art => art.sku == body.sku);

      if(this.idPoliza){
        if((selectedArticle[0].cantidad + this.editingPoliza.cantidad) < body.cantidad){
          this.snackBar.open('La cantidad es mayor al disponible en inventario', '',{ duration: 2000 });
          return;
        }
        this.service.updatePoliza(this.idPoliza, body).subscribe({
          next: (response) => {
            this.dialogRef.close({
              reload: true
            });
          },
          error: (e) => {
            console.log(e);
            this.snackBar.open(`Error al editar poliza ${this.idPoliza}`, '',{ duration: 2000 });
          },
        });

      } else {
        if(selectedArticle[0].cantidad < body.cantidad){
          this.snackBar.open('La cantidad es mayor al disponible en inventario', '',{ duration: 2000 });
          return;
        }

        this.service.savePoliza(body).subscribe({
          next: (response) => {
            this.dialogRef.close({
              reload: true
            });
          },
          error: (e) => {
            console.log(e);
            this.snackBar.open('Error al guardar poliza', '',{ duration: 2000 });
          },
        });
      }

    } else {
      this.snackBar.open('Favor de completar el formulario', '',{ duration: 2000 });
    }
  }

  close() {
    this.dialogRef.close({
      reload: false
    });
  }

  searchEmps() {    
    if (!this.employees) {
      return;
    }
    // get the search keyword
    let search = this.searchEmpCtrl.value;
    if (!search) {
      this.filteredEmps.next(this.employees.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the employees
    this.filteredEmps.next(
      this.employees.filter(emp => (emp.idEmpleado+': '+ emp.nombre +' '+ emp.apellido).toLowerCase().indexOf(search) > -1)
    );
  }

  searchArts() {    
    if (!this.articles) {
      return;
    }
    // get the search keyword
    let search = this.searchArtCtrl.value;
    if (!search) {
      this.filteredArts.next(this.articles.slice());
      return;
    } else {
      search = search.toLowerCase();
    }
    // filter the articles
    this.filteredArts.next(
      this.articles.filter(art => (art.sku + ': ' + art.nombre + ' [' + art.cantidad + ']' ).toLowerCase().indexOf(search) > -1)
    );
  }
}
