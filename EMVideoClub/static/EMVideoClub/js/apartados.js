let funcGenerales;

$(document).ready(function(){
    const functApartados = new apartados();
    funcGenerales = new funcionesGenerales();
});

class apartados {
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

        $('.dataTable').on('click','.btn-prestamo', function(){
            console.log($(this))

            $('#formPrestamo').find('input, select, textarea').not('#iCodEstatus').each(function(){
                if($(this).is('input')){
                    $(this).val('');
                }
                if($(this).is('select')){
                    $(this).html('').append('<option value="">- Seleccionar -</option>');
                }
            });

            let iCodSolicitudApartado = $(this).attr('id').split('-')[1]
            if(iCodSolicitudApartado){
                $.ajax({
                    method: 'post',
                    url:'/apartados/continuarPrestamo/',
                    data: {
                        iCodSolicitudApartado : iCodSolicitudApartado
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
                        console.log(response.apartado)
                        funcGenerales.rellenarDatos(response.apartado,'modalBodyContent');
                        funcGenerales.generarOptionsCopias(response.copias);
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

        $('#formPrestamo').on('submit', function(event){
            event.preventDefault()
            let datosPrestamo = funcGenerales.mapSerializedToJSON($(this).serializeArray());
            // console.log(datosPrestamo);
            if(Object.keys(datosPrestamo).length > 0){
                Swal.fire({
                    icon: 'warning',
                    title: 'Confirmar préstamo',
                    text: 'Desea confirmar el préstamo de la copia',
                    showConfirmButton: true,
                    showCancelButton: true,
                }).then((result)=>{
                    if(result.isConfirmed){
                        $.ajax({
                            method:'post',
                            url: '/peliculas/guardarPrestamo/',
                            data: {
                                datosPrestamo: JSON.stringify(datosPrestamo)
                            },
                            dataType: 'json',
                            beforeSend: ()=>{
                                Swal.fire({
                                    title: 'Guardando información',
                                    text: 'Espere un momento..',
                                    showConfirmButton: false,
                                    allowOutsideClick: false,
                                    didOpen: ()=>{
                                        Swal.showLoading();
                                    }
                                });
                            },
                            success: (response)=>{
                                // console.log(response);
                                Swal.fire({
                                    icon:'success',
                                    title: `${response.mensaje}, ID de préstamo: ${response.iCodSolicitudPrestamo}`,
                                    text: 'Que disfrute su película, favor de devolverla.',
                                    showConfirmButton: true,
                                    allowOutsideClick: false
                                }).then((result) =>{
                                    if(result.isConfirmed){
                                        $('#modalGeneral').modal('hide');
                                        location.reload();
                                    }
                                });
                            }
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
    generarOptionsCopias(listaCopias){
        let optionsHTML = '';  // string para acumular los <option>
        listaCopias.forEach((copia) => {
            // datosSocios[socio.iCodPersona] = [socio];
            optionsHTML += `<option value="${copia.iCodPeliculaCopia}">PC-${copia.iCodPeliculaCopia}</option>`;
        });
        
        $('#iCodPeliculaCopia').append(optionsHTML);
    }
}