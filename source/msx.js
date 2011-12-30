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
  //var sleepHack = 5;

  this.window = window;
  this.canvas = canvas;
  this.logbuf = logbuf;

  this.frameSkip = 0;
  this.vdp = null;
  this.psg = null;
  this.megarom = false;
  this.PPIPortA = 0;
  //this.PPIPortB = 255;
  this.PPIPortC = 0;
  this.PPIPortD = 0;
  this.pagMegaRom = [0, 1, 2, 3];
  //this.tamPagMegarom = 8192;
  this.tipoMegarom = 0;
  //this.controlPressionado = false;
  //this.shiftPressionado = false;
  this.memoria = []; //int[][]
  this.podeEscrever = [];
  this.pinta = true;
  this.cartSlot = 0;
  this.cart = []; //private int[][] cart;
  this.interruptCounter = 0;
  this.resetAtNextInterrupt = false;
  this.pauseAtNextInterrupt = false;
  //this.refreshNextInterrupt = true;
  //this.DipSwitchSYNC = true;

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

    //this.DipSwitchSYNC = 1;
    if (this.pinta) {
      this.vdp.updateScreen();
      this.pinta = false;
    }
    if (this.interruptCounter % this.frameSkip == 0)
      this.vdp.montaUsandoMemoria();

    //return this.superclass.interrupt();
    //calls superclass' interrupt() in msx context/scope.
    //return this.z80_interrupt();
  };

  this.stop = function() {
    clearInterval(this.frameInterval);
  };

  this.loadbiosrom = function(url, slot, canvasbiosrom) {
    var biosrom = msx_loadurl(url);
    var ctxbiosrom;
    var imgdatabiosrom;
    var dbr;
    var biosromlength;
    var charcode;
    var i;

    this.ui.updateStatus('Reading bios rom ' + url);
    this.ui.updateStatus(biosrom.length + ' bytes read');

    if (biosrom != '') {
      canvasbiosrom.width = 256;
      canvasbiosrom.height = biosrom.length / 256;
      //alert(biosrom.length+','+canvasbiosrom.width+','+canvasbiosrom.height);
      ctxbiosrom = canvasbiosrom.getContext('2d');
      ctxbiosrom.fillStyle = 'rgb(0,0,0)';
      ctxbiosrom.fillRect(0, 0, canvasbiosrom.width, canvasbiosrom.height);
      if (ctxbiosrom.getImageData) {
        imgdatabiosrom = ctxbiosrom.getImageData(0, 0, canvasbiosrom.width, canvasbiosrom.height);
        dbr = imgdatabiosrom.data;
      }
      biosromlength = biosrom.length;
      // MimeType('application/octet-stream; charset=x-user-defined')
      for (i = 0; i < biosromlength; i++) {
        charcode = biosrom.charCodeAt(i) & 0xff;
        this.memoria[slot][i] = charcode;
        if (dbr) {
          dbr[i * 4] = charcode;
          dbr[i * 4 + 1] = charcode;
          dbr[i * 4 + 2] = charcode;
        } else {
          ctxbiosrom.fillStyle = 'rgb(' + charcode + ',' + charcode + ',' + charcode + ')';
          ctxbiosrom.fillRect(i % canvasbiosrom.width, Math.floor(i / canvasbiosrom.width), 1, 1);
        }
      }
      if (ctxbiosrom.putImageData) {
        ctxbiosrom.putImageData(imgdatabiosrom, 0, 0);
      }
    }
    return biosrom;
  };

  this.loadcartrom = function(url, cartslot, megaromtype, canvascartrom) {
    var cartrom = msx_loadurl(url);
    var ctxcartrom;
    var imgdatacartrom;
    var dbr;
    var cartromlength;
    var charcode;
    var i;
    var i_2_;

    this.ui.updateStatus('Reading cart rom ' + url);
    this.ui.updateStatus(cartrom.length + ' bytes read');

    if (cartrom != '') {
      canvascartrom.width = 256;
      canvascartrom.height = cartrom.length / 256;
      //alert(cartrom.length+','+canvascartrom.width+','+canvascartrom.height);
      ctxcartrom = canvascartrom.getContext('2d');
      ctxcartrom.fillStyle = 'rgb(0,0,0)';
      ctxcartrom.fillRect(0, 0, canvascartrom.width, canvascartrom.height);
      if (ctxcartrom.getImageData) {
        imgdatacartrom = ctxcartrom.getImageData(0, 0, canvascartrom.width, canvascartrom.height);
        dbr = imgdatacartrom.data;
      } else {
        dbr = Array(canvascartrom.width * canvascartrom.height * 4);
      }
      cartromlength = cartrom.length;
      // MimeType('application/octet-stream; charset=x-user-defined')
      for (i = 0; i < cartromlength; i++) {
        charcode = cartrom.charCodeAt(i) & 0xff;
        //this.memoria[slot][i]=charcode;
        dbr[i * 4] = charcode;
        dbr[i * 4 + 1] = charcode;
        dbr[i * 4 + 2] = charcode;
        if (!ctxcartrom.getImageData) {
          ctxcartrom.fillStyle = 'rgb(' + charcode + ',' + charcode + ',' + charcode + ')';
          ctxcartrom.fillRect(i % canvascartrom.width, Math.floor(i / canvascartrom.width), 1, 1);
        }
      }
      if (ctxcartrom.putImageData) {
        ctxcartrom.putImageData(imgdatacartrom, 0, 0);
      }
    }

    //bool = false;

    cartromlength = cartrom.length;

    for (i = 0; i < cartromlength; i++) {
      this.cart[Math.floor(i / 8192)][i % 8192] = dbr[i * 4] + 256 & 0xff;
    }
    if (cartromlength > 0)
      i_2_ = (dbr[3 * 4] < 0 ? dbr[3 * 4] + 256 : dbr[3 * 4]) * 256 + (dbr[2 * 4] < 0 ? dbr[2 * 4] + 256 : dbr[2 * 4]);
    if (i_2_ < 8192) {
      i_2_ = 0;
      this.PPIPortC = 250;
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
    for (i = 0; i < cartromlength; i++)
      this.memoria[cartslot][i + i_2_] = dbr[i * 4] + 256 & 0xff;

    return cartrom;
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

  this.podeEscrever = [false, false, false, true];
  this.pinta = true;
  this.cart = Array(32); //2-dimensional array 32x8192 of cartridges
  for (i = 0; i < 32; i++) {
    //for (j=0; j<8192; j++) acart[j]=0;
    this.cart[i] = Array(8192);
  }
  this.interruptCounter = 0;
  this.frameSkip = 1;
  //this.sleepHack = 5;
  this.resetAtNextInterrupt = false;
  this.pauseAtNextInterrupt = false;
  //this.refreshNextInterrupt = true;
  //this.DipSwitchSYNC = 0;

  this.ui.updateStatus('Starting RAM slots');
  this.memoria = Array(4); //4 primary slots
  this.m0 = Array(65536);
  this.memoria[0] = this.m0;
  for (i = 0; i < 65536; i++) this.m0[i] = 255;
  this.m1 = Array(65536);
  this.memoria[1] = this.m1;
  for (i = 0; i < 65536; i++) this.m1[i] = 255;
  this.m2 = Array(65536);
  this.memoria[2] = this.m2;
  for (i = 0; i < 65536; i++) this.m2[i] = 255;
  this.m3 = Array(65536);
  this.memoria[3] = this.m3;
  for (i = 0; i < 65536; i++) this.m3[i] = 255;
  this.cpu.reset();

  this.ui.updateStatus('Starting VDP');
  this.vdp = new tms9918(this.canvas);

  this.ui.updateStatus('Starting PSG (No Sound)');
  this.psg = new psg8910();

  this.ui.updateStatus('interrupt=' + this.interruptCounter + ',ticks=' + Math.floor(this.cpu.tstatesPerInterrupt) + ' cpu ticks/interrupt, cpu clock=3.58 MHz');
  this.ui.updateStatus('jsMSX ready to go. Load ROMs and hit [start].');
}

var msx_loadurl = function(url) {
  //alert(url);
  var io = new browserio();
  var data = io.load(url);
  //alert(data);
  return data;
};
