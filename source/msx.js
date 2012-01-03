/* JSMSX - MSX Emulator in Javascript
 * Copyright (c) 2006 Marcus Granado <mrc.gran(@)gmail.com>
 *
 * Portions of the initial code was inspired by the work of
 * Arnon Cardoso's Java MSX Emulator and
 * Adam Davidson & Andrew Pollard's Z80 class of the Spectrum Java Emulator
 * after reading this thread: http://www.msx.org/forumtopic4176.html
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 * The full license is available at http://www.gnu.org/licenses/gpl.html
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 */



/**
 * @constructor
 */
function JSMSX(window, canvas, logbuf) {
  var self = this;
  var i;

  this.window = window;
  this.canvas = canvas;
  this.logbuf = logbuf;

  this.vdp = null;
  this.psg = null;

  this.megarom = false;
  this.pagMegaRom = [0, 1, 2, 3];
  this.tipoMegarom = 0;
  this.podeEscrever = [];
  this.cartSlot = 0;
  this.cart = []; //private int[][] cart;

  this.frameSkip = 0;
  this.pinta = true;
  this.interruptCounter = 0;
  this.resetAtNextInterrupt = false;
  this.pauseAtNextInterrupt = false;

  this.start = function() {
    var self = this;

    this.frameInterval = setInterval(function() {
      self.frame();
    }, 17); //60 intervals/sec
  };

  this.frame = function() {
    if (this.resetAtNextInterrupt) {
      this.resetAtNextInterrupt = false;
      this.cpu.reset();
    }

    this.cpu.execute();

    if (this.vdp.imagedata)
      this.vdp.imagedata.data[this.interruptCounter * 4 + 1] = 255;//green line

    document.getElementById('interrupts').value = this.interruptCounter;
    //if (this.interruptCounter%600==0)
    //this.ui.updateStatus('interrupt='+this.interruptCounter+',ticks='+this.tstatesPerInterrupt+' cpu ticks/interrupt');
    this.interruptCounter++;

    if (this.pinta) {
      this.vdp.updateScreen();
      this.pinta = false;
    }
    if (this.interruptCounter % this.frameSkip == 0)
      this.vdp.montaUsandoMemoria();
  };

  this.stop = function() {
    clearInterval(this.frameInterval);
  };

  this.preparaMemoriaMegarom = function(string) {
    if (string != null) {
      if (string == '0')
        this.tipoMegarom = 0;
      else if (string == '1')
        this.tipoMegarom = 1;
      else if (string == '2')
        this.tipoMegarom = 2;
      else if (string == '3')
        this.tipoMegarom = 3;
    }
  };

  this.ui = new JSMSX.UI(this, logbuf);
  this.cpu = new Z80(this, 3.58);
  this.keyboard = new JSMSX.Keyboard(this);

  //local constructor
  //initializes local variables
  this.ui.updateStatus('Booting jsMSX');

  this.ui.updateStatus('Starting RAM slots');
  this.podeEscrever = [false, false, false, true];
  this.cart = Array(32); //2-dimensional array 32x8192 of cartridges
  for (i = 0; i < 32; i++) {
    this.cart[i] = Array(8192);
  }

  this.frameSkip = 1;
  this.pinta = true;
  this.interruptCounter = 0;
  this.resetAtNextInterrupt = false;
  this.pauseAtNextInterrupt = false;

  this.cpu.reset();

  this.ui.updateStatus('Starting VDP');
  this.vdp = new tms9918(this.canvas);

  this.ui.updateStatus('Starting PSG (No Sound)');
  this.psg = new psg8910();

  this.ui.updateStatus('interrupt=' + this.interruptCounter + ',ticks=' + Math.floor(this.cpu.tstatesPerInterrupt) + ' cpu ticks/interrupt, cpu clock=3.58 MHz');
  this.ui.updateStatus('jsMSX ready to go. Load ROMs and hit [start].');
}

JSMSX.prototype = {
  loadBios: function(data, slot) {
    for (var i = 0; i < data.length; i++) {
      this.cpu.mem[slot][i] = data.charCodeAt(i) & 0xff;
    }
  },

  loadRom: function(data, slot, megaromtype) {
    var cartromlength = data.length;
    var dbr = [];
    var i;
    var i_2_;

    for (i = 0; i < cartromlength; i++) {
      dbr[i] = data.charCodeAt(i) & 0xff;
      this.cart[Math.floor(i / 8192)][i % 8192] = dbr[i] + 256 & 0xff;
    }

    if (cartromlength > 0) {
      i_2_ = (dbr[3] < 0 ? dbr[3] + 256 : dbr[3]) * 256 + (dbr[2] < 0 ? dbr[2] + 256 : dbr[2]);
    }
    if (i_2_ < 8192) {
      i_2_ = 0;
      this.cpu.PPIPortC = 250;
    } else if (i_2_ < 16384)
      i_2_ = 8192;
    else if (i_2_ < 32768)
      i_2_ = 16384;
    else
      i_2_ = 32768;
    this.ui.updateStatus('Cart start address:' + i_2_);
    if (cartromlength > 32768) {
      cartromlength = 16384;
      this.megarom = true;
      this.preparaMemoriaMegarom(megaromtype);
      this.ui.updateStatus('Megarom type ' + megaromtype);
    }
    for (i = 0; i < cartromlength; i++) {
      this.cpu.mem[slot][i + i_2_] = dbr[i] + 256 & 0xff;
    }
  }
};
