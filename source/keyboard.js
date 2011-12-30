/*
JSMSX - MSX Emulator in JavaScript
Original copyright (c) 2006 Marcus Granado <mrc.gran(@)gmail.com>
Copyright (C) 2011  Guillaume Marty

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/



/**
 * Keyboard events are bound in the UI.
 *
 * @constructor
 * @param {JSMSX} msx
 */
JSMSX.Keyboard = function(msx) {
  this.msx = msx;

  this.state = new Array(9);
  for (var i = 0; i < 9; i++) {
    this.state[i] = 255;
  }
};

JSMSX.Keyboard.prototype = {
  /**
   * @param {Event} evt
   */
  keydown: function(evt) {
    switch (evt.keyCode) {
      case 48: this.state[0] &= 0xfe; break;   // 0
      case 49: this.state[0] &= 0xfd; break;   // 1
      case 50: this.state[0] &= 0xfb; break;   // 2
      case 51: this.state[0] &= 0xf7; break;   // 3
      case 52: this.state[0] &= 0xef; break;   // 4
      case 53: this.state[0] &= 0xdf; break;   // 5
      case 54: this.state[0] &= 0xbf; break;   // 6
      case 55: this.state[0] &= 0x7f; break;   // 7
      case 56: this.state[1] &= 0xfe; break;   // 8
      case 57: this.state[1] &= 0xfd; break;   // 9
      case 45: this.state[1] &= 0xfb; break;   // -
      case 61: this.state[1] &= 0xf7; break;   // ^
      case 92: this.state[1] &= 0xef; break;   // $
      case 91: this.state[1] &= 0xdf; break;   // @
      case 93: this.state[1] &= 0xbf; break;   // (
      case 59: this.state[1] &= 0x7f; break;   // ;
      //case 34:
      //case 39:
      case 1013: this.state[2] &= 0xfe; break; // :
      case 48: this.state[2] &= 0xfd; break;   // )
      case 188: this.state[2] &= 0xfb; break;  // ,
      case 190: this.state[2] &= 0xf7; break;  // .
      case 191: this.state[2] &= 0xef; break;  // /
      case 109: this.state[2] &= 0xdf; break;  // _
      case 65: this.state[2] &= 0xbf; break;   // A
      case 66: this.state[2] &= 0x7f; break;   // B
      case 67: this.state[3] &= 0xfe; break;   // C
      case 68: this.state[3] &= 0xfd; break;   // D
      case 69: this.state[3] &= 0xfb; break;   // E
      case 70: this.state[3] &= 0xf7; break;   // F
      case 71: this.state[3] &= 0xef; break;   // G
      case 72: this.state[3] &= 0xdf; break;   // H
      case 73: this.state[3] &= 0xbf; break;   // I
      case 74: this.state[3] &= 0x7f; break;   // J
      case 75: this.state[4] &= 0xfe; break;   // K
      case 76: this.state[4] &= 0xfd; break;   // L
      case 77: this.state[4] &= 0xfb; break;   // M
      case 78: this.state[4] &= 0xf7; break;   // N
      case 79: this.state[4] &= 0xef; break;   // O
      case 80: this.state[4] &= 0xdf; break;   // P
      case 81: this.state[4] &= 0xbf; break;   // Q
      case 82: this.state[4] &= 0x7f; break;   // R
      case 83: this.state[5] &= 0xfe; break;   // S
      case 84: this.state[5] &= 0xfd; break;   // T
      case 85: this.state[5] &= 0xfb; break;   // U
      case 86: this.state[5] &= 0xf7; break;   // V
      case 87: this.state[5] &= 0xef; break;   // W
      case 88: this.state[5] &= 0xdf; break;   // X
      case 89: this.state[5] &= 0xbf; break;   // Y
      case 90: this.state[5] &= 0x7f; break;   // Z
      case 1017:
        this.msx.pauseAtNextInterrupt = this.msx.pauseAtNextInterrupt ^ true;
        break;
      case 1019:
        this.msx.frameSkip++;
        this.msx.frameSkip %= 20;
        break;
      case 1018:
        this.msx.frameSkip--;
        if (this.msx.frameSkip < 1)
          this.msx.frameSkip = 1;
        break;
      case 16: this.state[6] &= 0xfe; break;   // SHIFT
      case 17: this.state[6] &= 0xfd; break;   // CTRL
      case 18: this.state[6] &= 0xfb; break;   // GRAPH (ALT in PC)
      case 20: this.state[6] &= 0xf7; break;   // CAP
      case 118: this.state[6] &= 0xef; break;  // CODELOCK (F7 in PC)
      case 112: this.state[6] &= 0xdf; break;  // F1
      case 113: this.state[6] &= 0xbf; break;  // F2
      case 114: this.state[6] &= 0x7f; break;  // F3
      case 115: this.state[7] &= 0xfe; break;  // F4
      case 116: this.state[7] &= 0xfd; break;  // F5
      case 27: this.state[7] &= 0xfb; break;   // ESC
      case 9: this.state[7] &= 0xf7; break;    // TAB
      case 19: this.state[7] &= 0xef; break;   // STOP
      case 8: this.state[7] &= 0xdf; break;    // BACKSPACE
      case 117: this.state[7] &= 0xbf; break;  // SELECT (F6 in PC)
      case 13: this.state[7] &= 0x7f; break;   // RETURN
      case 32: this.state[8] &= 0xfe; break;   // SPACE
      case 36: this.state[8] &= 0xfd; break;   // HOME
      case 45: this.state[8] &= 0xfb; break;   // INSERT
      case 46: this.state[8] &= 0xf7; break;   // DELETE
      case 37: this.state[8] &= 0xef; break;   // LEFTARROW
      case 38: this.state[8] &= 0xdf; break;   // UPARROW
      case 40: this.state[8] &= 0xbf; break;   // DOWNARROW
      case 39: this.state[8] &= 0x7f; break;   // RIGHTARROW
      default: return; //browser should handle key event
    }

    evt.preventDefault();
  },

  /**
   * @param {Event} evt
   */
  keyup: function(evt) {
    switch (evt.keyCode) {
      case 48: this.state[0] |= 0x1; break;    // 0
      case 49: this.state[0] |= 0x2; break;    // 1
      case 50: this.state[0] |= 0x4; break;    // 2
      case 51: this.state[0] |= 0x8; break;    // 3
      case 52: this.state[0] |= 0x10; break;   // 4
      case 53: this.state[0] |= 0x20; break;   // 5
      case 54: this.state[0] |= 0x40; break;   // 6
      case 55: this.state[0] |= 0x80; break;   // 7
      case 56: this.state[1] |= 0x1; break;    // 8
      case 57: this.state[1] |= 0x2; break;    // 9
      case 45: this.state[1] |= 0x4; break;    // -
      case 61: this.state[1] |= 0x8; break;    // ^
      case 92: this.state[1] |= 0x10; break;   // $
      case 91: this.state[1] |= 0x20; break;   // @
      case 93: this.state[1] |= 0x40; break;   // (
      case 59: this.state[1] |= 0x80; break;   // ;
      //case 34:
      //case 39:
      case 1013: this.state[2] |= 0x1; break;  // :
      case 48: this.state[2] |= 0x2; break;    // )
      case 188: this.state[2] |= 0x4; break;   // ,
      case 190: this.state[2] |= 0x8; break;   // .
      case 191: this.state[2] |= 0x10; break;  // /
      case 109: this.state[2] |= 0x20; break;  // _
      case 65: this.state[2] |= 0x40; break;   // A
      case 66: this.state[2] |= 0x80; break;   // B
      case 67: this.state[3] |= 0x1; break;    // C
      case 68: this.state[3] |= 0x2; break;    // D
      case 69: this.state[3] |= 0x4; break;    // E
      case 70: this.state[3] |= 0x8; break;    // F
      case 71: this.state[3] |= 0x10; break;   // G
      case 72: this.state[3] |= 0x20; break;   // H
      case 73: this.state[3] |= 0x40; break;   // I
      case 74: this.state[3] |= 0x80; break;   // J
      case 75: this.state[4] |= 0x1; break;    // K
      case 76: this.state[4] |= 0x2; break;    // L
      case 77: this.state[4] |= 0x4; break;    // M
      case 78: this.state[4] |= 0x8; break;    // N
      case 79: this.state[4] |= 0x10; break;   // O
      case 80: this.state[4] |= 0x20; break;   // P
      case 81: this.state[4] |= 0x40; break;   // Q
      case 82: this.state[4] |= 0x80; break;   // R
      case 83: this.state[5] |= 0x1; break;    // S
      case 84: this.state[5] |= 0x2; break;    // T
      case 85: this.state[5] |= 0x4; break;    // U
      case 86: this.state[5] |= 0x8; break;    // V
      case 87: this.state[5] |= 0x10; break;   // W
      case 88: this.state[5] |= 0x20; break;   // X
      case 89: this.state[5] |= 0x40; break;   // Y
      case 90: this.state[5] |= 0x80; break;   // Z
      //case 1017:
      //case 1019:
      //case 1018:
      case 16: this.state[6] |= 0x1; break;    // SHIFT
      case 17: this.state[6] |= 0x2; break;    // CTRL
      case 18: this.state[6] |= 0x4; break;    // GRAPH (ALT in PC)
      case 20: this.state[6] |= 0x8; break;    // CAP
      case 118: this.state[6] |= 0x10; break;  // CODELOCK (F7 in PC)
      case 112: this.state[6] |= 0x20; break;  // F1
      case 113: this.state[6] |= 0x40; break;  // F2
      case 114: this.state[6] |= 0x80; break;  // F3
      case 115: this.state[7] |= 0x1; break;   // F4
      case 116: this.state[7] |= 0x2; break;   // F5
      case 27: this.state[7] |= 0x4; break;    // ESC
      case 9: this.state[7] |= 0x8; break;     // TAB
      case 19: this.state[7] |= 0x10; break;   // STOP
      case 8: this.state[7] |= 0x20; break;    // BACKSPACE
      case 117: this.state[7] |= 0x40; break;  // SELECT (F6 in PC)
      case 13: this.state[7] |= 0x80; break;   // RETURN
      case 32: this.state[8] |= 0x1; break;    // SPACE
      case 36: this.state[8] |= 0x2; break;    // HOME
      case 45: this.state[8] |= 0x4; break;    // INSERT
      case 46: this.state[8] |= 0x8; break;    // DELETE
      case 37: this.state[8] |= 0x10; break;   // LEFTARROW
      case 38: this.state[8] |= 0x20; break;   // UPARROW
      case 40: this.state[8] |= 0x40; break;   // DOWNARROW
      case 39: this.state[8] |= 0x80; break;   // RIGHTARROW
      default: return; //browser should handle key event
    }

    evt.preventDefault();
  }
};
