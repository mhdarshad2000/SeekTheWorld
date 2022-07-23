const days = Number(document.getElementById('days').value)
flatpickr(
    '#myID',
    {
        altInput: true,
        minDate: new Date().fp_incr(7),
        maxDate: new Date().fp_incr(60),
        allowInput: true,
        altFormat: 'F j, Y',
        dateFormat: 'Y-m-d',
        disableMobile: 'true',

        onChange(selectedDates) {
            flatpickr(
                '#myID2',
                {
                    altInput: true,

                    position: 'left',
                    dateFormat: 'Y-m-d',
                    defaultDate: selectedDates[0].setDate(selectedDates[0].getDate()+ days),
                    minDate: selectedDates[0].setDate(selectedDates[0].getDate()),
                    maxDate: selectedDates[0].setDate(selectedDates[0].getDate()),
                    altFormat: 'F j, Y',
                    allowInput: true,
                    disableMobile: 'true',
                },
            );
        },
    },
);
