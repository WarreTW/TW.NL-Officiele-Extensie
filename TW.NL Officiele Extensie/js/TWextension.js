window.TWextension = {
  lsItem: 'TWextension_quickbarList_' + ((game_data.player.sitter == '0') ? game_data.player.id : game_data.player.sitter),
  quickbarUrl: TribalWars.buildURL('GET', 'settings', {mode: 'quickbar'}),
  quickbarList: [],
  init: function(screen, mode) {
    this.quickbarList = JSON.parse(localStorage.getItem(this.lsItem)) || [];
    this.runListCleanup();

    if (screen == 'settings' && mode.match('quickbar')) {
      if (mode == 'quickbar') TWextension.quickbarScreen.init();
      if (mode == 'quickbar_edit') TWextension.editQuickbarScreen.init();
    } else {
      $('.footer-link').last().after(`&nbsp;-&nbsp;<a href="${this.quickbarUrl}" class="footer-link">Snelschakellijst</a>`);
      this.changeQuickBar();
      this.quickbarList.forEach((item) => {
        QuickBar.openEntry(item, '#');
      });
    }
  },
  addListItem: function(hash, msg = true) {
    if (!this.quickbarList.includes(hash)) {
      this.quickbarList.push(hash);
      localStorage.setItem(this.lsItem, JSON.stringify(this.quickbarList));
      if (msg) UI.SuccessMessage('Wijziging opgeslagen.');
    }
  },
  removeListItem: function(hash, msg = true) {
    let i = this.quickbarList.indexOf(hash);
    if (i >= 0) {
      this.quickbarList.splice(i, 1);
      localStorage.setItem(this.lsItem, JSON.stringify(this.quickbarList));
      if (msg) UI.SuccessMessage('Wijziging opgeslagen.');
    }
  },
  handleCheckboxChange: function(hash, checked) {
    (checked) ? TWextension.addListItem(hash) : TWextension.removeListItem(hash);
  },
  createInfoImage: function() {
    return $('<img>', {
      class: 'infoTooltip',
      src: '/graphic/questionmark.png',
      title: 'Vink deze optie aan om het snellijstscript automatisch uit te voeren bij elke pagina die geladen wordt.<br><br>Deze functionaliteit wordt aangeboden door de TW.NL Officiële Extensie en zal enkel werken als de extensie actief is.',
      style: 'width:13px;height:13px;'
    });
  },
  createInfoBox: function() {
    return $('<div>', {
      class: 'info_box quickbarListInfo',
      style: 'display:none;font-size:11px;line-height:16px;overflow:auto;',
      html: '<b>Er zijn meer dan 5 snellijstscripts geselecteerd om automatisch uit te voeren, door de limiet van 5 per seconden zullen scripts mogelijk traag laden.</b><br><br>We raden aan om het aantal geselecteerde scripts te limiteren tot maximaal 5 of meerdere scripts samen te voegen tot 1 script.'
    }).add($('<div>', {
      style: 'clear:both;'
    }));
  },
  checkAndShowInfoBox: function() {
    let length = ($('.autoExecute').prop('checked')) ? this.quickbarList.length + 1 : this.quickbarList.length;
    (length > 5) ? $('.quickbarListInfo').show() : $('.quickbarListInfo').hide();
  },
  changeQuickBar: function() {
    QuickBar.fetchFromServer = function(hash, result) {
      twLib.get(
        TribalWars.buildURL('GET', 'api', {
          ajax: 'quickbar_entry',
          hash: hash
        })
      ).done((data) => {
        result(data.entry);
      })
    };
  },
  runListCleanup: function() {
    if (!mobile && $('.menu-village-stronghold').length == 0) {
      this.quickbarList.forEach((item) => {
        if ($(`.quickbar_link[data-hash="${item}"]`).length == 0) {
          this.removeListItem(item, false);
        }
      });
    }
  }
}

window.TWextension.quickbarScreen = {
  init: function() {
    let index = localStorage.getItem('TWextension_tempIndex') || null;
    if (index !== null) {
      TWextension.addListItem($('#quickbar > tr').eq(index).attr('name'), false);
      localStorage.removeItem('TWextension_tempIndex');
    }

    $('#quickbar').closest('table').css({'float': ((mobiledevice) ? 'none' : 'left'), 'margin-right': '10px'}).after(TWextension.createInfoBox());
    TWextension.checkAndShowInfoBox();

    $('<th>', {
      style: 'text-align:center;'
    }).append(TWextension.createInfoImage()).insertAfter($('#quickbar').closest('table').find('th').first());
    UI.ToolTip($('.infoTooltip'));

    $('#quickbar > tr').map((_, el) => {
      let $td = $('<td>', {
        style: 'text-align:center;'
      });

      if ($(el).find('hr').length == 0) {
        $td.append(
          $('<input>', {
            type: 'checkbox'
          }).prop('checked', TWextension.quickbarList.includes($(el).attr('name'))).on('change', (e) => {
            TWextension.handleCheckboxChange($(el).attr('name'), $(e.currentTarget).prop('checked'));
            TWextension.checkAndShowInfoBox();
          })
        );
      }

      $td.insertBefore($(el).find('td').eq(-3));
    });

    $('.quickbar_delete_link').on('click', (e) => {
      TWextension.removeListItem($(e.currentTarget).closest('tr').attr('name'));
    });

    $('<a>', {
      href: '#',
      text: '» Automatisch uitvoeren scripts terugzetten (TW.NL Officiële Extensie)'
    }).on('click', () => {
      localStorage.removeItem(TWextension.lsItem);
      location.reload();
    }).wrap('<p></p>').parent().appendTo($('#quickbar').closest('td[valign="top"]'));
  }
}

window.TWextension.editQuickbarScreen = {
  init: function() {
    let $form = $('.ar_url').closest('form');
    let hash = $form.find('input[name="hash"]').val() || null;

    $form.css({'float': ((mobiledevice) ? 'none' : 'left'), 'margin-right': '10px'}).after(TWextension.createInfoBox());
    TWextension.checkAndShowInfoBox();

    $('<label>', {
      text: ' Automatisch uitvoeren '
    }).prepend(
      $('<input>', {
        type: 'checkbox',
        class: 'autoExecute'
      }).prop('checked', (hash !== null && TWextension.quickbarList.includes(hash))).on('change', () => {
        TWextension.checkAndShowInfoBox();
      })
    ).append(TWextension.createInfoImage()).wrap('<tr><td colspan="2"></td></tr>').parent().insertBefore($('input[name="blank"]').closest('tr'));
    UI.ToolTip($('.infoTooltip'));

    $form.on('submit', () => {
      let autoExecute = $('.autoExecute').prop('checked');

      if (hash === null) {
        if (autoExecute) localStorage.setItem('TWextension_tempIndex', '-1');
      } else {
        TWextension.removeListItem(hash, false);

        if (autoExecute) {
          twLib.get(TWextension.quickbarUrl).done((html) => {
            localStorage.setItem('TWextension_tempIndex', $(html).find(`#quickbar > tr[name="${hash}"]`).index());
          });
        }
      }
    });
  }
}

TWextension.init(game_data.screen, game_data.mode);
