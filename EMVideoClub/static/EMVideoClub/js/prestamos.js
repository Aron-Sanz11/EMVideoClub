let funcGenerales;

$(document).ready(function(){
    const functPrestamos = new prestamos();
    funcGenerales = new funcionesGenerales();
});

class prestamos{
    constructor(){
        this.iniciarPlugins();
        this.iniciarEventos();
    }

    iniciarPlugins(){
        $('.datatable').DataTable({
            'responsive':true,
            'autoWidth': false
        });
    }

    iniciarEventos(){
        let self = this;

        $.ajaxSetup({
            headers: { "X-CSRFToken": $('[name=csrfmiddlewaretoken]').val() }
        });

        $('.datatable').on('click', '.btn-devolver', function(){
            let iCodSolicitudPrestamo = $(this).attr('id').split('-')[1];

            if(iCodSolicitudPrestamo){
                $.ajax({
                    method:'post',
                    url:'/prestamos/iniciarDevolucion/',
                    data: {
                        iCodSolicitudPrestamo: iCodSolicitudPrestamo
                    },
                    dataType: 'json',
                    beforeSend: ()=>{
                        Swal.fire({
                            title: 'Cargando información',
                            text: 'Espere un momento..',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            didOpen: ()=>{
                                Swal.showLoading();
                            }
                        });
                    },
                    success: (response)=>{
                        funcGenerales.rellenarDatos(response.prestamo,'modalBodyContent');
                        $('#modalGeneral').modal('show')
                        Swal.close();
                                                
                    },
                    error: (xhr, status, error)=>{
                        console.error("Ocurrió un error:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups...',
                            text: 'Algo salió mal al obtener los detalles 😢',
                        });
                    }
                });
            }
        });

        $('#formDevolverPrestamo').on('submit', function(event){
            event.preventDefault()
            let dataDevolucion = $(this).serializeArray();
            if(dataDevolucion.length > 0){

                $.ajax({
                    method:'post',
                    url:'/prestamos/devolverPrestamo/',
                    data:{
                        dataDevolucion: JSON.stringify(funcGenerales.mapSerializedToJSON(dataDevolucion))
                    },
                    dataType: 'json',
                    beforeSend: ()=>{
                        Swal.fire({
                            title: 'Actualizando información',
                            text: 'Espere un momento..',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            didOpen: ()=>{
                                Swal.showLoading();
                            }
                        });
                    },
                    success: (response)=>{
                        // console.log(response)
                        if(response.status == true){
                            Swal.fire({
                                icon:'success',
                                title: response.mensaje,
                                showConfirmButton: true,
                                allowOutsideClick: false
                            }).then((result) => {
                                if(result.isConfirmed){
                                    $('#modalGeneral').modal('hide');
                                    location.reload();
                                }
                            }); 
                        }
                    },
                    error: (xhr, status, error)=>{
                        console.error("Ocurrió un error:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups...',
                            text: 'Algo salió mal al obtener los detalles 😢',
                        });
                    }
                });
            }
        });
    }
}

class funcionesGenerales{

    /**
    * Serializa todos los elementos con el atributo "name" dentro de un selector especificado.
    * 
    * Esta función está diseñada para casos donde no se puede utilizar el método serializeArray() 
    * directamente sobre un formulario, como en bloques de HTML dinámicos o estructuras más específicas.
    * 
    * - Incluye inputs, selects, checkboxes y radios con el atributo "name".
    * - Los checkboxes y radios solo se consideran si están marcados.
    * - Devuelve un array plano con objetos { name, value }, ignorando elementos sin valor válido.
    * 
    * @param {string} selector - Selector CSS del contenedor donde se encuentran los elementos a serializar.
    * @returns {Array} Array de objetos con el formato { name: string, value: string }.
    * 
    * Ejemplo de uso:
    * let data = serializeNamedElements('.miClaseBloque');
    * let data = serializeNamedElements('#miDivBloque');
    * console.log(data);
    * 
    * -ASP-
    */
    serializeNamedElements(selector) {
        return $(selector).find('[name]').map(function () {
            const isCheckboxOrRadio = $(this).is(':checkbox') || $(this).is(':radio');
            const value = isCheckboxOrRadio ? ($(this).is(':checked') ? $(this).val() : null) : $(this).val();
    
            // Incluir solo si el valor es válido
            return value ? { name: $(this).attr('name'), value } : null;
        }).get(); // Devuelve un array plano
    }
    
    /**
    * Convierte datos serializados en un objeto JSON organizado por 'name'.
    * @param {Array} serializedData - Datos serializados (name, value).
    * @returns {Object} Objeto JSON estructurado.
    * 
    * -ASP-
    */
    
    mapSerializedToJSON(serializedData) {
        const dataForm = {};
    
        serializedData.forEach(({ name, value }) => {
            if (value !== '') {
            const keys = name.split('[').map((key) => key.replace(']', ''));
            keys.reduce((acc, key, index) => {
                if (index === keys.length - 1) {
                acc[key] = value; // Asignar valor en la última clave
                } else {
                acc[key] = acc[key] || {}; // Crear objeto si no existe
                }
                return acc[key];
            }, dataForm);
            }
        });
    
        return dataForm;
    }

    rellenarDatos(arrayDatos, contenedor){

        arrayDatos.forEach((datos, index) => {
            for (let [clave, valor] of Object.entries(datos)) {

                let $elemento = $(`#${contenedor}`).find((`#${clave}`));
                if ($elemento.length > 0) {
                    if ($elemento.is('input, select, textarea')) {
                        $elemento.val(valor);
                    } else if ($elemento.is('img')) {
                        $elemento.attr('src', valor);
                    } else if ($elemento.is('a')) {
                        $elemento.attr('href', valor).text(valor);
                    } else {
                        $elemento.text(valor);
                    }
                }
            }
        });
    }
}