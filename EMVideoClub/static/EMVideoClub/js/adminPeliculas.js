let funcGenerales;

$(document).ready(function(){
    const functAdminPeliculas = new adminPeliculas();
    funcGenerales = new funcionesGenerales();
});

class adminPeliculas{
    constructor(){
        this.iniciarPlugins();
        this.iniciarEventos();
    }

    iniciarPlugins(){
        $('.datatable').DataTable();
        /* Configuración del select2 multiple para agregar nuevo género como etiqueta*/
        $('#tNombreGenero').select2({
            dropdownParent: $('#modalAgregarGenero'),
            tags: true,
            createTag: (textoTipeado)=> {
                let texto = textoTipeado.term.trim();

                if(texto === ''){
                    return null;
                }

                return {
                    id: textoTipeado.term,
                    text: textoTipeado.term,
                    newTag: true
                };
            }
        });
    }

    iniciarEventos(){
        $.ajaxSetup({
            headers: { "X-CSRFToken": $('[name=csrfmiddlewaretoken]').val() }
        });

        $('#tNombreGenero').on('select2:select', function (event) {
            let bAgregarGeneroaPelicula = ()=> $('#bAgregarGeneroaPelicula').is(':checked') ? 'Se le agregará el género a la película' : 'No se le agregará el género a la película';

            let data = event.params.data;

            if (data.newTag) {
                Swal.fire({
                    icon: 'question',
                    title: 'Nuevo género ingresado',
                    html: `¿Desea agregar el género "${data.text}" al catálogo?<br><b><span style="color:red">${bAgregarGeneroaPelicula()}</span></b>`,
                    showConfirmButton: true,
                    showCancelButton: true,
                    allowOutsideClick: false
                }).then((result) => {
                    if (!result.isConfirmed) {
                        // Si cancela, quitas el tag
                        let values = $(this).val().filter(val => val !== data.id);
                        $(this).val(values).trigger('change');
                    }
                });
            }
        });

        $(document).on('click', function(event) {
            // Si el clic NO vino desde un botón .btn-detallesPrestamo
            if (!$(event.target).closest('.btn-detallesPrestamo, #divDetallesPrestamo').length) {
                // $('#divDetallesPrestamo').hide();
                $('#divDetallesPrestamo').stop(true, true).slideUp(300);
            }
        });

        $('.btn-agregarPelicula').on('click', function(){
            $('#modalAgregarPelicula').modal('show');
        });

        $('#tblPeliculas').on('click', '.btn-detalles', function(){
            let iCodPelicula = $(this).attr('id').split('-')[1];
            $.ajax({
                method: 'post',
                url: '/adminPeliculas/detallesPelicula',
                data: {
                    iCodPelicula : iCodPelicula
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
                    // console.log(response);
                    // return false;
                    let directores = response.pelicula[0].personas.filter((persona) => persona.iCodRol == 2);
                    let actores = response.pelicula[0].personas.filter((persona) => persona.iCodRol == 3);

                    funcGenerales.rellenarDatos(response.pelicula, 'formPelicula');
                    funcGenerales.generarRegistrosPorCopia(response.pelicula[0].copias,'tblBodyCopias');
                    

                    funcGenerales.rellenarChecksBoxs(response.pelicula[0].generos, 'divGeneros')
                    funcGenerales.rellenarChecksBoxs(directores, 'divDirectores');
                    funcGenerales.rellenarChecksBoxs(actores, 'divActores');

                    $('#divDetallesPrestamo').hide();

                    $('#tblCopias').DataTable();
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
        });

        $('#formPelicula').on('submit', function(event){
            event.preventDefault();
            let dataForm = $(this).serializeArray();
            if(dataForm.length > 0){
                $.ajax({
                    method:'post',
                    url: '/adminPeliculas/guardarDetallesPelicula',
                    data: {
                        dataForm : JSON.stringify(funcGenerales.mapSerializedToJSON(dataForm))
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
                            title: response.mensaje,
                            showConfirmButton: true,
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
        
        $('#tblCopias').on('click', '.btn-darBajaAlta', function(){
            let iCodPeliculaCopia = $(this).attr('id').split('-')[1];
            let bActivo = Number($(this).data('bactivo'));

            let accionText = (estado) => estado === 1  ? 'alta' : 'baja';

            // console.log(iCodPeliculaCopia, bActivo)
            if(iCodPeliculaCopia){
                Swal.fire({
                    icon: 'question',
                    title: `Dar de ${accionText(bActivo)} copia: PC-${iCodPeliculaCopia}`,
                    text: `¿Está seguro de dar de ${accionText(bActivo)} la copia?`,
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: `Sí, dar de ${accionText(bActivo)}`
                }).then((result)=>{
                    if(result.isConfirmed){
                        $.ajax({
                            method: 'post',
                            url: '/adminPeliculas/darBajaAltaPeliculaCopia',
                            data:{
                                iCodPeliculaCopia : iCodPeliculaCopia,
                                bActivo : bActivo
                            },
                            dataType: 'json',
                            beforeSend:()=>{
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
                                // console.log(response);
                                funcGenerales.generarRegistrosPorCopia(response.copias,'tblBodyCopias');
                                Swal.fire({
                                    icon:'success',
                                    title: response.mensaje,
                                    showConfirmButton: true,
                                });
                            },
                            error: (xhr, status, error)=>{
                                console.error("Ocurrió un error:", error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Ups...',
                                    text: 'Algo salió mal al intentar actualizar los detalles 😢',
                                });
                            }
                        });
                    }
                });
            }
        });
        
        $('#tblCopias').on('click','.btn-detallesPrestamo', function(e){
            e.stopPropagation();
            let iCodPeliculaCopia = $(this).attr('id').split('-')[1];

            if(iCodPeliculaCopia){
                $.ajax({
                    method:'post',
                    url: '/adminPeliculas/detallesPrestamo',
                    data: {
                        iCodPeliculaCopia : iCodPeliculaCopia
                    },
                    dataType: 'json',
                    beforeSend:()=>{
                        Swal.fire({
                            title: 'Obteniendo información',
                            text: 'Espere un momento..',
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            didOpen: ()=>{
                                Swal.showLoading();
                            }
                        });
                    },
                    success: (response)=>{

                        funcGenerales.rellenarDatos(response.prestamo,'divDetallesPrestamo');
                        // $('#divDetallesPrestamo').toggle();
                        $('#divDetallesPrestamo').stop(true, true).slideToggle(300);
                        Swal.close();
                    },
                    error: (xhr, status, error)=>{
                        console.error("Ocurrió un error:", error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Ups...',
                            text: 'Algo salió mal al intentar obtener la información 😢',
                        });
                    }
                });
            }
        });

        $('#formAgregarPelicula').on('submit', function(event){
            event.preventDefault();
            let dataForm = $(this).serializeArray();
            if(dataForm.length > 0){
                dataForm = funcGenerales.mapSerializedToJSON(dataForm);
                Swal.fire({
                    icon:'question',
                    title: `¿Desea agredar la película ${dataForm.pelicula.tNombre} al catálogo?`,
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText:'Confirmar',
                }).then((result) => {
                    if(result.isConfirmed){
                        $.ajax({
                            method:'post',
                            url:'/adminPeliculas/agregarPelicula',
                            data: {
                                dataForm : JSON.stringify(dataForm)
                            },
                            dataType:'json',
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
                                console.log(response.iCodPelicula);
                                Swal.fire({
                                    icon:'success',
                                    title: response.mensaje,
                                    text:'Ahora puede agregar los detalles de la película en el tablero 😁📼',
                                    showConfirmButton: true,
                                    allowOutsideClick: false,
                                }).then((result)=>{
                                    if(result.isConfirmed){
                                        location.reload();
                                    }
                                });
                                // console.log(response);
                            },
                            error: (xhr, status, error)=>{
                                console.error("Ocurrió un error:", error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Ups...',
                                    text: 'Algo salió mal al intentar guardar la información 😢',
                                });
                            }
                        });
                    }
                });
            }
        });

        $('#dtlsAgregarCopiasPelicula').on('toggle', function() {
            if (this.open) {
                $('#formPeliculaCopia').find('input').val('');
            }
        });        

        $('.btn-close').on('click', function(){
            $('#dtlsAgregarCopiasPelicula').prop('open', false).trigger('click')
        });

        $('#formPeliculaCopia').on('submit', function(event){
            event.preventDefault();
            let dataForm = $(this).serializeArray();
            if(dataForm.length > 0){
                dataForm = funcGenerales.mapSerializedToJSON(dataForm);
                dataForm['iCodPelicula'] = $('#iCodPelicula').val();

                Swal.fire({
                    icon:'question',
                    title: `¿Desea agregar ${dataForm.numeroCopias} copias a la película ${$('#tNombrePelicula').val()}?`,
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Sí, agregar'
                }).then((result)=>{
                    if(result.isConfirmed){
                        $.ajax({
                            method:'post',
                            url: '/adminPeliculas/agregarCopias',
                            data : {
                                dataForm: JSON.stringify(dataForm)
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
                                console.log(response.iCodPelicula);
                                Swal.fire({
                                    icon: 'success',
                                    title: response.mensaje,
                                    showConfirmButton: true
                                });
                                $('#dtlsAgregarCopiasPelicula').prop('open', false).trigger('click');
                                funcGenerales.generarRegistrosPorCopia(response.copias,'tblBodyCopias');
                                $('#tblCopias').DataTable();
                            },
                            error: (xhr, status, error)=>{
                                console.error("Ocurrió un error:", error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Ups...',
                                    text: 'Algo salió mal al intentar guardar la información 😢',
                                });
                            }
                        });
                    }
                });
            }
        });
        
        $('.btn-agregarGenero').on('click', function(){
            $('#modalAgregarGenero').modal('show');
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

    generarRegistrosPorCopia(arrayDatos = [], contenedor){

        let btnDarBaja = (iCodEstatus, iCodPeliculaCopia, bActivo)=>{
            let button = '';

            if(bActivo == 1){
                if(iCodEstatus == 1){
                    button = `<button class="btn btn-outline-primary btn-darBajaAlta" data-bactivo="0" id="btn-${iCodPeliculaCopia}">😅🗑️</button>`
                }else if(iCodEstatus == 2){
                    button = `<button class="btn btn-outline-success btn-detallesPrestamo" id="btn-${iCodPeliculaCopia}">🍿📼</button>`;
                }
            }else{
                button = `<button class="btn btn-outline-primary btn-darBajaAlta" data-bactivo="1" id="btn-${iCodPeliculaCopia}">😁✅</button>`
            }
            return button;
        }

        let tableClass = (bActivo, iCodEstatus) =>{
            let text = '';
            if(bActivo == 1){
                text = iCodEstatus == 1 ? 'success' : 'warning'
            }else{
                text = 'danger';
            }
            return text;
        }

        if(arrayDatos.length > 0){
            let html = '';
            arrayDatos.forEach((copia)=>{
                html += `
                    <tr class="table-${tableClass(copia.bActivo, copia.iCodEstatus)}" id="tr-${copia.iCodPeliculaCopia}">
                        <td>${copia.tNombrePelicula}</td>
                        <td>PC-${copia.iCodPeliculaCopia}</td>
                        <td>${copia.tEstatusCopia}</td>
                        <td>${btnDarBaja(copia.iCodEstatus, copia.iCodPeliculaCopia, copia.bActivo)}</td>
                    </tr>
                `;
            });

            $(`#${contenedor}`).html(html);
        }else{
            return '';
        }
    }

    rellenarChecksBoxs(arrayDatos = [], contenedor = ''){
        $(`#${contenedor}`).find('input').each(function(){
            if($(this).is(':checkbox')){
                $(this).prop('checked', false);
                if(arrayDatos.length > 0){
                    arrayDatos.forEach((datos, index)=>{
                        if($(this).val() == Object.values(datos)[0]){
                            $(this).prop('checked', true)
                        }
                    });
                }
            }
        });
    }
    
    normalizarTexto(texto) {
        return texto.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    
}