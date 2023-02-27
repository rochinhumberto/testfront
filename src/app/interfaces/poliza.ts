import { Articulo } from "./articulo";
import { Empleado } from "./empleado";

export interface Poliza {
    idPoliza: number;
    cantidad: number;
    fecha: string;
    empleado: Empleado;
    articulo: Articulo;
}