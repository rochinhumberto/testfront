import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from 'src/app/api.service';
import { Poliza } from 'src/app/interfaces/poliza';
import { Respuestas } from 'src/app/interfaces/respuestas';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { PolizaDialogComponent } from '../poliza-dialog/poliza-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, debounceTime, map, of, startWith, Subject, switchMap, takeUntil } from 'rxjs';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-polizas',
  templateUrl: './polizas.component.html',
  styleUrls: ['./polizas.component.scss']
})
export class PolizasComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['id', 'emp', 'article', 'sku', 'amount', 'date', 'options'];
  dataSource = new MatTableDataSource<Poliza>();
  isLoading = false;
  searchPolizaCtrl: FormControl = new FormControl();

  @ViewChild(MatPaginator) paginator: MatPaginator;

  res: Respuestas;
  totalPolizas = 0;
  pageSizes = [5, 20, 50, 100];

  protected _onDestroy = new Subject<void>();

  constructor(
    private service: ApiService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

    this.paginator.page.pipe(
      startWith({}),
      switchMap(() => {
        if(this.searchPolizaCtrl.value && this.searchPolizaCtrl.value != '' ){
          return this.service.searchPolizas(
            this.searchPolizaCtrl.value,
            this.paginator.pageIndex,
            this.paginator.pageSize
          ).pipe(catchError(() => of(null)));
        }
        return this.service.getPolizas(
          this.paginator.pageIndex,
          this.paginator.pageSize
        ).pipe(catchError(() => of(null)));
      }),
      map((polizas) => {       
        if (polizas == null) return [];
        this.totalPolizas = polizas.Data?.Polizas?.totalElements;          
        return polizas.Data?.Polizas?.content;
      })
      ).subscribe({
        next: (polizas) => {
          if(!polizas.length){
            this.snackBar.open('Error al obtener polizas', '',{ duration: 2000 });
          } else {
            this.dataSource = polizas;
          }
        },
        error: (e) => {
          console.log(e);
          this.snackBar.open('Error al obtener polizas', '',{ duration: 2000 });
        }
      });

    this.searchPolizaCtrl.valueChanges
    .pipe(debounceTime(800),takeUntil(this._onDestroy))
    .subscribe((value) => {
      if(value == ''){
        this.getPolizas();
      } else {
        this.searchPolizas(value);
      }
    });
  }

  ngOnInit(): void { }

  getPolizas(){
    this.isLoading = true;
    this.service.getPolizas(0, this.pageSizes[0]).subscribe({
      next: (response) => {
        this.res = response;
        this.dataSource = response.Data?.Polizas?.content;
        this.totalPolizas = response.Data?.Polizas?.totalElements;
        this.paginator.pageIndex = 0;
        this.paginator.pageSize = this.pageSizes[0];
        this.isLoading = false;
      },
      error: (e) => {
        console.log(e);
        this.snackBar.open('Error al obtener polizas', '',{ duration: 2000 });
      },
    });
  }

  searchPolizas(query: string){
    this.isLoading = true;
    this.service.searchPolizas(query, 0, this.pageSizes[0]).subscribe({
      next: (response) => {
        this.res = response;
        this.dataSource = response.Data?.Polizas?.content;
        this.totalPolizas = response.Data?.Polizas?.totalElements;
        this.paginator.pageIndex = 0;
        this.paginator.pageSize = this.pageSizes[0];
        this.isLoading = false;
      },
      error: (e) => {
        console.log(e);
        this.snackBar.open('Error al obtener polizas', '',{ duration: 2000 });
      },
    });
  }

  logout(){
    localStorage.removeItem("token");
    this.router.navigate(['/login']);
  }

  newPoliza(){
    const dialogRef = this.dialog.open(PolizaDialogComponent, {
      disableClose: true,
      autoFocus: true,
      width: '300px',
      data: {
        title: 'Nueva Póliza'
      }
    });

    dialogRef.afterClosed().subscribe(data => {
      if(data.reload){
        this.getPolizas();
      }
    });
  }

  editPoliza(id: number){
    const dialogRef = this.dialog.open(PolizaDialogComponent, {
      disableClose: true,
      autoFocus: true,
      width: '300px',
      data: {
        title: 'Editar Póliza',
        idPoliza: id
      }
    });

    dialogRef.afterClosed().subscribe(data => {      
      if(data.reload){        
        this.getPolizas();
      }
    });
  }

  deletePoliza(id: number){
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      autoFocus: true,
      data: `Esta seguro de eliminar la póliza: ${id}`
    });

    dialogRef.afterClosed().subscribe(response => {
      if(response){
        this.service.deletePoliza(id).subscribe({
          next: (response) => {
            this.snackBar.open(`Póliza ${id} eliminada`, '',{ duration: 2000 });
            this.getPolizas();
          },
          error: (e) => {
            console.log(e);
            this.snackBar.open(`Error al eliminar póliza ${id}`, '',{ duration: 2000 });
          },
        });
      }
    });
  }

}
