$('#event-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/events?' + search, function(data) {
    $('#event-grid').html('');
    data.forEach(function(event) {
      $('#event-grid').append(`
        <div class="col-md-3 col-sm-6">
          <div class="thumbnail">
            <img src="${ event.image }">
            <div class="caption">
              <h4>${ event.name }</h4>
            </div>
            <p>
              <a href="/events/${ event._id }" class="btn btn-primary">More Info</a>
            </p>
          </div>
        </div>
      `);
    });
  });
});

$('#event-search').submit(function(event) {
  event.preventDefault();
});
