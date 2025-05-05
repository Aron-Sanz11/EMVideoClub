let funcGenerales;

$(document).ready(function(){
    const functSocios = new socios();
    funcGenerales = new funcionesGenerales();
});

class socios{

    constructor(){
        this.iniciarPlugins();
        this.iniciarEventos();
    }

    iniciarPlugins(){
        $('.maskNumeroTelefonico').inputmask('9999999999');
    }

    iniciarEventos(){
        $.ajaxSetup({
            headers: { "X-CSRFToken": $('[name=csrfmiddlewaretoken]').val() }
        });

        let self = this;

        $('.btn-detalles').on('click', function(){
            let iCodPersona = $(this).attr('id').split('-')[1]
            if(iCodPersona){
                $.ajax({
                    method:'post',
                    url:'/socios/detallesSocios/',
                    data: {
                        iCodPersona : iCodPersona
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
                        // console.log(response)
                        funcGenerales.rellenarDatos(response.socio,'modalBodyContent');
                        funcGenerales.generarChecksBoxsGeneros(response.generos, 'generos','contentGeneros');
                        funcGenerales.generarChecksBoxsDirectores(response.directores, 'directores','contentDirectores');
                        funcGenerales.generarChecksBoxsActores(response.actores, 'actores','contentActores');

                        funcGenerales.rellenarChecksBoxsFavoritos(response.generosFavoritos,'contentGeneros');
                        funcGenerales.rellenarChecksBoxsFavoritos(response.directoresFavoritos,'contentDirectores');
                        funcGenerales.rellenarChecksBoxsFavoritos(response.actoresFavoritos,'contentActores');
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

        $('.btn-nuevoSocio').on('click', function(){
            $('#modalNuevoSocio').modal('show');
            // Reiniciamos el formulario y los socios para que haya basura
            $('#formNuevoSocio').find('input, select, textarea').not('#iCodRol').each(function(){
                if($(this).is('input')){
                    $(this).val('');
                }
                if($(this).is('select')){
                    $(this).html('').append('<option value="">- Seleccionar -</option><option>Masculino</option><option>Femenino</option>');
                }
            });
        });

        $('#formPersona').on('submit', function(event){
            event.preventDefault();

            let dataForm = $(this).serializeArray();
            if(dataForm.length > 0){
                $.ajax({
                    method:'post',
                    url: '/socios/guardarDetallesSocio/',
                    data: {
                        dataForm: JSON.stringify(funcGenerales.mapSerializedToJSON(dataForm))
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
                        Swal.fire({
                            icon:'success',
                            title: 'Se actualizaron los datos correctamente',
                            showConfirmButton: true,
                            allowOutsideClick: false
                        }).then((result) => {
                            if(result.isConfirmed){
                                $('#modalGeneral').modal('hide');
                                location.reload();
                            }
                        }); 
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
                // console.log();
            }
        });

        $('#formNuevoSocio').on('submit', function(event){

            event.preventDefault();
            let dataForm = $(this).serializeArray();
            if(dataForm.length > 0){
                $.ajax({
                    method: 'post',
                    url: '/socios/nuevoSocio/',
                    data: {
                        dataForm: JSON.stringify(funcGenerales.mapSerializedToJSON(dataForm))
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
                        Swal.fire({
                            icon:'success',
                            title: response.mensaje,
                            showConfirmButton: true,
                            allowOutsideClick: false
                        }).then((result) => {
                            if(result.isConfirmed){
                                $('#modalNuevoSocio').modal('hide');
                                location.reload();
                            }
                        }); 
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
    
        serializedData.forEach(
            ({ name, value }) => {
                if (value !== '') {
                    const keys = name.split('[').map(
                        (key) => key.replace(']', '')
                    );
                    keys.reduce((acc, key, index) => {
                        if (index === keys.length - 1) {
                            acc[key] = value; // Asignar valor en la última clave
                        } else {
                            acc[key] = acc[key] || {}; // Crear objeto si no existe
                        }
                        return acc[key];
                    },dataForm);
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

    rellenarChecksBoxsFavoritos(arrayDatos = [], contenedor = ''){
        if(arrayDatos.length > 0){
            $(`#${contenedor}`).find('input').each(function(){
                if($(this).is(':checkbox')){
                    arrayDatos.forEach((datos, index)=>{
                        if($(this).val() == Object.values(datos)[0]){
                            $(this).prop('checked', true)
                        }
                    })
                }
            });
        }
    }

    generarChecksBoxsGeneros(arrayDatos = [], name = '', contenedor = ''){
        contenedor = $(`#${contenedor}`);
        contenedor.html('')

        arrayDatos.forEach((datos, index) =>{
            let checkbox = $(`
                <div class="col-md-3">
                    <div class="form-group clearfix">
                        <div class="icheck-primary d-inline">
                            <input type="checkbox" name="${name}[genero-${datos.iCodGenero}]" id="genero-${datos.iCodGenero}" value="${datos.iCodGenero}"><label for="genero-${datos.iCodGenero}">${datos.tNombreGenero}</label>
                        </div>
                    </div>
                </div>
                `);
            contenedor.append(checkbox);
        });
    }

    generarChecksBoxsDirectores(arrayDatos = [], name = '', contenedor = ''){
        contenedor = $(`#${contenedor}`);
        contenedor.html('')

        arrayDatos.forEach((datos, index) =>{
            let checkbox = $(`
                <div class="col-md-3">
                    <div class="form-group clearfix">
                        <div class="icheck-primary d-inline">
                            <input type="checkbox" name="${name}[director-${datos.iCodDirector}]" id="director-${datos.iCodDirector}" value="${datos.iCodDirector}"><label for="director-${datos.iCodDirector}">${datos.tNombre}</label>
                        </div>
                    </div>
                </div>
                `);
            contenedor.append(checkbox);
        });
    }

    generarChecksBoxsActores(arrayDatos = [], name = '', contenedor = ''){
        contenedor = $(`#${contenedor}`);
        contenedor.html('')

        arrayDatos.forEach((datos, index) =>{
            let checkbox = $(`
                <div class="col-md-3">
                    <div class="form-group clearfix">
                        <div class="icheck-primary d-inline">
                            <input type="checkbox" name="${name}[actor-${datos.iCodActor}]" id="actor-${datos.iCodActor}" value="${datos.iCodActor}"><label for="actor-${datos.iCodActor}">${datos.tNombre}</label>
                        </div>
                    </div>
                </div>
                `);
            contenedor.append(checkbox);
        });
    }
}