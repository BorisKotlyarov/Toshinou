/*
Created by Freshek on 07.10.2017
*/

// Proposal: Rename all "window" mentions to "pane" in order to have
// less confusion with JS window object.

const HEADER_HEIGHT = 40;
const ANIMATION_DURATION_MS = 400;

class WindowFactory {
  static createWindow(params) {
    const pane = jQuery('<div>', {
      width: params.width || 400,
      height: (params.height + HEADER_HEIGHT) || '',
      'class': 'window',
      css: {
        backgroundColor: 'transparent',
        position: 'fixed',
      },
    }).appendTo('body');

    const headerCol = ColorConverter.hexToRgb(window.globalSettings.headerColor);
    const header = jQuery('<h4>', {
      text: params.text || 'Untitled',
      'class': 'header',
      css: {
        backgroundColor: ColorConverter.combine(headerCol.r, headerCol.g, headerCol.b, window.globalSettings.headerOpacity),
      },
    }).appendTo(pane);

    // TODO: Custom scrollbar
    const contentColor = ColorConverter.hexToRgb(window.globalSettings.windowColor);
    const content = jQuery('<div>', {
      'class': 'content',
      css: {
        maxHeight: params.maxHeight || '',
        backgroundColor: ColorConverter.combine(contentColor.r, contentColor.g, contentColor.b, window.globalSettings.windowOpacity),
      },
    }).appendTo(pane);

    const minimizeBtn = jQuery('<span>', {
      text: '_',
      'class': 'minimize-btn',
    }).appendTo(header);

    minimizeBtn.click(() => {
      if (content.is(':visible')) {
        content.slideUp(ANIMATION_DURATION_MS)
        .animate({
          opacity: 0,
        }, {
          queue: false,
          duration: ANIMATION_DURATION_MS,
        });
      } else {
        content.slideDown(ANIMATION_DURATION_MS)
        .animate({
          opacity: window.globalSettings.windowOpacity ,
        }, {
          queue: false,
          duration: ANIMATION_DURATION_MS,
        });
      }
    });

    pane.draggable({
      handle: header,
      drag: (e, ui) => {
        ui.position.left = Math.max(-pane.width() / 2, ui.position.left);
        ui.position.left = Math.min(ui.position.left, $(window).width() - pane.width() / 2);
        ui.position.top = Math.max(-HEADER_HEIGHT / 2, ui.position.top);
        ui.position.top = Math.min(ui.position.top, $(window).height() - HEADER_HEIGHT / 2);
      }
    });

    return content;
  }
}
