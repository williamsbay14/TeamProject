window.onload = function () {
    new Chart(document.getElementById("mixed-chart"), {
        type: 'bar',
        data: {
            labels: ["1900", "1950", "1999", "2050"],
            datasets: [{
                label: "Test1",
                type: "line",
                borderColor: "#8e5ea2",
                data: [408, 547, 675, 734],
                fill: false
            }, {
                label: "Test2",
                type: "line",
                borderColor: "#3e95cd",
                data: [133, 221, 783, 2478],
                fill: false
            }, {
                label: "Test3",
                type: "bar",
                backgroundColor: "rgba(0,0,0,0.2)",
                data: [408, 547, 675, 734],
            }, {
                label: "Test4",
                type: "bar",
                backgroundColor: "rgba(0,0,0,0.2)",
                backgroundColorHover: "#3e95cd",
                data: [133, 221, 783, 2478]
            }
            ]
        },
        options: {
            title: {
                display: true,
                text: 'Historical and Predicted Water Quality Results'
            },
            legend: { display: false }
        }
    });
};

$(document).ready(function () {
    var view = 0,
        views = $('.view'),
        viewCount = views.length - 1,
        data;

    // Navigation
    $('.next').on('click', function () {
        if (view < viewCount) {
            $('#view-' + view).addClass('d-none');
            $('li[data-view="view-' + view + '"]').removeClass('active');
            view = view + 1;
            $('#view-' + view).removeClass('d-none');
            $('li[data-view="view-' + view + '"]').addClass('active');
            if (view == viewCount) {
                $('.next').prop('disabled', true);
            }
        }
    });

    // Prevents default behavior on dragging files into browser
    $('#dropzone').on('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
    });

    // Executes file upload when file is dropped
    $('#dropzone').on('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();

        var file = e.originalEvent.dataTransfer.files,
            form = new FormData();

        form.append('file', file[0]);

        uploadData(form);
    });

    // Executes file upload when file is selected
    $("#file2").change(function () {
        var form = new FormData();
        var files = $('#file2')[0].files[0];
        form.append('file', files);
        uploadData(form);
    });

    // Posts file to server
    function uploadData(form) {
        // Clears errors on each upload
        $('#error').addClass('d-none');

        // Submits post request to server
        $.ajax({
            url: 'http://127.0.0.1:5000/api/upload',
            type: 'post',
            data: form,
            contentType: false,
            processData: false,
            dataType: 'json',
            beforeSend: function () {
                $('.upload-progress').modal('toggle');
            },
            complete: function (res) {
                // Removes modal after half a second of ajax completion
                // This allows modal to be hidden if invalid filetype
                setTimeout(function () {
                    $('.upload-progress').modal('toggle');
                }, 500);
            },
            success: function (res) {
                if (res.status == 'error') {
                    // Displays error messages
                    $('#error').removeClass('d-none').html(res.message);
                } else {
                    // Assigns CSV JSON to local variable
                    $('#proceed').prop('disabled', false);
                    data = res.data;

                    init(data);

                    $('#upload').addClass('d-none');
                    $('#upload-table').removeClass('d-none');

                    var html = '<tr><td>' + res.file.name + '</td><td>' + res.file.extension + '</td><td>' + res.file.size + '</td></tr>';

                    for (var i = 0; i < 9; i++) {
                        html += '<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp; </td></tr>';
                    }

                    $('.table1 tbody').html(html);
                }
            },
            failure: function (res) {
                // hopefully this won't happen ;)
            }
        });
    }

    /** Configure **/

    // Data bindings
    $("#configure").on("click", ".data-field", loadData);
    $("#configure").on("click", ".data-test", enableTestOpts);
    $("#modifyTest").on("click", modifyTest);
    $("#removeTest").on("click", removeTest);
    $("#save-changes").on("click", modifyMeta);
    $("#test-select").on("change", testFields);
    $("#save-test-changes").on("click", saveTest);
    $("#addTest").on("click", resetTests);

    var selected,
    update = false;

    init();

    function init(data) {
        var fields = "",
        keys = Object.keys(data[0]);

        $.each(keys, function (i, item) {
            fields += "<button class='btn btn-block data-field' data-index='" + i + "'>" + item + "</button>";
        });
        $("#data-fields").html(fields);
        renderChart();
    }

    function loadData() {
        selected = $(this).data("index");

        updateMeta();

        $("#modifyMeta").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");
        $("#addTest").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");

        $("#modifyTest").addClass("btn-secondary").removeClass("btn-success").addClass("disabled");
        $("#removeTest").addClass("btn-secondary").removeClass("btn-success").addClass("disabled");

        $(".modify-meta .modal-title").html(data[selected].name);

    }

    function updateMeta() {
        var fieldData = data[selected],
            html = "";

        html += "Meta 1: Meta value 1<br />";
        html += "Meta 2: Meta value 2<br />";
        html += "Meta 3: Meta value 3<br />";
        html += "Meta 4: Meta value 4<br />";
        html += "Meta 5: Meta value 5<br />";

        $("#data-meta").html(html);

        if(fieldData.tests.length > 0){
            var testHTML = "";
            for(var i = 0; i < fieldData.tests.length; i++){
                testHTML += "<button class='btn btn-block data-test' data-index='" + i + "'>" + fieldData.tests[i].test + "</button>";
            }
            $("#data-tests").html(testHTML);
        } else {
            $("#data-tests").html("");
        }
    }

    function modifyMeta() {

        data[selected].units = $("#units").val();
        data[selected].dataType = $("#data-type").val();
        data[selected].unitName = $("#time-units").val();
        data[selected].category = $("#category").val();
        data[selected].interval = $("#interval").val();

        updateMeta();
    }

    function testFields() {
        var test = $(this).val(),
        fields = $("option[value='"+test+"']").data("fields");

        $(".sup-fields").addClass("d-none");

        if(fields) {
            $("#" + fields).removeClass("d-none");
            $("#save-test-changes").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");
        } else {
            $("#save-test-changes").addClass("btn-secondary").removeClass("btn-success").addClass("disabled");
        }
    }

    function resetTests() {
        $("#test-select").val("");
        $(".sup-fields").addClass("d-none");
    }

    function enableTestOpts() {
        $(".data-test").removeClass("btn-primary");
        $(this).addClass("btn-primary");
        $("#modifyTest").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");
        $("#removeTest").removeClass("btn-secondary").addClass("btn-success").removeClass("disabled");
    }

    function modifyTest() {
        var testData = data[selected].tests[$(".data-test.btn-primary").data("index")],
        fields = $("option[value='"+testData.test+"']").data("fields");

        $(".add-test").modal("show");
        $("#test-select").val(testData.test);

        update = true;
    }

    function saveTest() {
        var selectedTest = $("#test-select").val(),
        test = {test: selectedTest};

        switch(selectedTest){
            case "Outlier Detection":
                test.values = [
                    {
                        lowerThreshold: $("#lower-threshold").val() == "" ? -100 : $("#lower-threshold").val(),
                        upperThreshold: $("#upper-threshold").val() == "" ? 100 : $("#upper-threshold").val()
                    }
                ];
                break;
            case "Repeat Value":
                test.values = [
                    {
                        valueMatch: $("#value-match").val() == "" ? 0 : $("#value-match").val()
                    }
                ];
                break;
            case "Machine learning":
                test.values = [
                    {
                        dimension: $("#dimension").val() == "" ? 3 : $("#dimension").val(),
                        attribute: $("#attribute").val() == "" ? "Jawline" : $("#attribute").val(),
                        feature: $("#feature").val() == "" ? "Gender" : $("#feature").val()
                    }
                ];
                break;
        }
        if(!update){
            data[selected].tests.push(test);
        } else {
            update = false;
        }

        updateMeta();
    }

    function removeTest() {
        var tests = data[selected].tests,
        index = $(".data-test.btn-primary").data("index"),
        newTests = [];

        for(var i = 0; i < tests.length; i++){
            if(i != index){
                newTests.push(tests[i]);
            }
        }

        data[selected].tests = newTests;

        $(".data-test.btn-primary").remove();
    }

    function renderChart() {
        var testChart = new Chart(
            $("#chart"),
            {
                type: 'line',
                data: {
                    labels: [-10, 0, 10, 20, 30, 40],
                    datasets: [
                        {
                            data: [0, 30, 25, 50, -10, 80],
                            label: "",
                            borderColor: "#3e95cd",
                            fill: false
                        }
                    ]
                },
                options: {
                    title: {
                        display: false
                    },
                    legend: {
                        display: false
                    }
                }
            }
        );
    }

    /** End Configure **/

    $('#runTests').on('click', function () {
        $('.progress').css('display', 'block');
        var counter = 0;
        var downloadTimer = setInterval(function () {
            document.getElementById("pbar").value = 0 + ++counter;
            if (counter > 100) {
                clearInterval(downloadTimer);
                $('.progress').css('display', 'none');
                $('#onlyAfterRun').css('display', 'block');
                $('#nowContinue').click();
            }
        }, 10);
    });
})
