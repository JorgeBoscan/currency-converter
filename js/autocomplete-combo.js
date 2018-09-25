$( function() {
    $.widget( "custom.combobox", {
      _create: function() {
        this.wrapper = $( "<span>" )
          .addClass( "custom-combobox" )
          .insertAfter( this.element );
 
        this.element.hide();
        this._createAutocomplete();
        this._createShowAllButton();
      },
 
      _createAutocomplete: function() {
        var selected = this.element.children( ":selected" ),
          value = selected.val() ? selected.text() : "";
 
        this.input = $( "<input>" )
          .appendTo( this.wrapper )
          .val( value )
          .attr( "title", "" )
          .addClass( "custom-combobox-input ui-widget ui-widget-content ui-state-default ui-corner-left" )
          .autocomplete({
            delay: 0,
            minLength: 0,
            source: $.proxy( this, "_source" ),
            select: function(event, ui) {
                addCurrency(ui.item.value);
                $('#combobox').val('0');
            },
            change: function() {
                this.value = '';
            }
          })
          .tooltip({
            classes: {
              "ui-tooltip": "ui-state-highlight"
            }
          });
 
        this._on( this.input, {
          autocompleteselect: function( event, ui ) {
            ui.item.option.selected = true;
            this._trigger( "select", event, {
              item: ui.item.option
            });
          },
 
          autocompletechange: "_removeIfInvalid"
        });
      },
 
      _createShowAllButton: function() {
        var input = this.input,
          wasOpen = false
 
        $( "<a>" )
          .attr( "tabIndex", -1 )
          .attr( "title", "Show All Items" )
          .attr( "height", "" )
          .tooltip()
          .appendTo( this.wrapper )
          .button({
            icons: {
              primary: "ui-icon-triangle-1-s"
            },
            text: "false"
          })
          .removeClass( "ui-corner-all" )
          .addClass( "custom-combobox-toggle ui-corner-right" )
          .on( "mousedown", function() {
            wasOpen = input.autocomplete( "widget" ).is( ":visible" );
          })
          .on( "click", function() {
            input.trigger( "focus" );
 
            // Close if already visible
            if ( wasOpen ) {
              return;
            }
 
            // Pass empty string as value to search for, displaying all results
            input.autocomplete( "search", "" );
          });
      },
 
      _source: function( request, response ) {
        var matcher = new RegExp( $.ui.autocomplete.escapeRegex(request.term), "i" );
        response( this.element.children( "option" ).map(function() {
          var text = $( this ).text();
          if ( this.value && ( !request.term || matcher.test(text) ) )
            return {
              label: text,
              value: text,
              option: this
            };
        }) );
      },
 
      _removeIfInvalid: function( event, ui ) {
 
        // Selected an item, nothing to do
        if ( ui.item ) {
          return;
        }
 
        // Search for a match (case-insensitive)
        var value = this.input.val(),
          valueLowerCase = value.toLowerCase(),
          valid = false;
        this.element.children( "option" ).each(function() {
          if ( $( this ).text().toLowerCase() === valueLowerCase ) {
            this.selected = valid = true;
            return false;
          }
        });
 
        // Found a match, nothing to do
        if ( valid ) {
          return;
        }
 
        // Remove invalid value
        this.input
          .val( "" )
          .attr( "title", value + " didn't match any item" )
          .tooltip( "open" );
        this.element.val( "" );
        this._delay(function() {
          this.input.tooltip( "close" ).attr( "title", "" );
        }, 2500 );
        this.input.autocomplete( "instance" ).term = "";
      },
 
      _destroy: function() {
        this.wrapper.remove();
        this.element.show();
      }
    });
 
    $( "#combobox" ).combobox();
    $( "#toggle" ).on( "click", function() {
      $( "#combobox" ).toggle();
    });
  } );

var currenciesCards = [];

function addCurrency(currency) {
    if (currenciesCards.indexOf(currency) < 0) {
        $('#list').append('<div id="' + currency + '" class="col-12 col-lg-4">' +
        '<div class="card features">' +
            '<div class="card-body">' +
                '<div class="media">' +
                    '<img src="' + countries[currency].imageurl + '" class="flag"/>' +
                    '<div class="media-body">' +
                        '<button type="button" class="btn icon" onclick="refresh(\'' + currency + '\')"><i class="material-icons">refresh</i></button>' +
                        '<button type="button" class="btn icon" onclick="removeCurrency(\'' + currency + '\')">' +
                            '<i class="material-icons">delete</i>' +
                        '</button>' +
                        '<h4 class="card-title">' + currency + '</h4>' +
                        '<input id="' + currency + '-value" type="text" class="form-control" onchange="calculate(\'' + currency + '\')"/>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>');
        currenciesCards.push(currency);
        getUSDCurrency(currency);
    }
};

function getUSDCurrency(currency) {
    if (currency === 'VEF') {
        $.get('https://s3.amazonaws.com/dolartoday/data.json', function(data) {
            $('#' + currency).data('value', data['USD'].dolartoday);
            $('#' + currency + '-value').val(Number($('#USD-value').val()) * data['USD'].dolartoday);
        })
        .fail(function() {

        });
    } else {
        $.get('http://free.currencyconverterapi.com/api/v5/convert?q=USD_' + currency + '&compact=y', function(data) {
            $('#' + currency).data('value', data['USD_' + currency].val);
            $('#' + currency + '-value').val(Number($('#USD-value').val()) * data['USD_' + currency].val);
        })
        .fail(function() {

        });
    }
};

function removeCurrency(currency) {
    $('#' + currency).remove();
    currenciesCards.splice(currenciesCards.indexOf(currency), 1);
};

function calculate(currency) {
    var usdAmount = 0;
    if (currency === 'USD') {
        usdAmount = Number($('#USD-value').val());
    } else {
        usdAmount = Number($('#' + currency + '-value').val()) / Number($('#' + currency).data('value'));
        $('#USD-value').val(usdAmount);
    }

    for (var i in currenciesCards) {
        var cur = currenciesCards[i];
        if (cur !== currency) {
            $('#' + cur + '-value').val(usdAmount * Number($('#' + cur).data('value')));
        }
    }
};

function refresh(currency) {
    getUSDCurrency(currency);
    calculate(currency);
};