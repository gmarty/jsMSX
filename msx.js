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

function MSX(window,canvas,logbuf)
{
    this.window = window;
    this.canvas = canvas;
    this.logbuf = logbuf;

    //this class builds on the Z80 class.
    this.superclass = Z80; //superclass
    this.superclass(3.58); //initialization
    //this.z80_interrupt = this.interrupt;

    this.vdp = null; 
    this.psg = null;
    this.megarom = false;
    this.PPIPortA = 0;
    this.PPIPortB = 255;
    this.PPIPortC = 0;
    this.PPIPortD = 0;
    this.pagMegaRom = [ 0, 1, 2, 3 ];
    this.tamPagMegarom = 8192;
    this.tipoMegarom = 0;
    this.portos = new Array (256);
    this.controlPressionado = false;
    this.shiftPressionado = false;
    this.estadoTeclas = new Array();
    this.memoria = new Array(); //int[][]
    this.podeEscrever = Array();
    this.pinta = true;
    this.cartSlot = 0;
    this.cart = new Array(); //private int[][] cart; 
    this.interruptCounter=0;
    var frameSkip = 0;
    var sleepHack = 5;
    this.resetAtNextInterrupt=false;
    this.pauseAtNextInterrupt=false;
    this.refreshNextInterrupt=true;
    this.DipSwitchSYNC=true;


    this.println = function(str) {
	this.logbuf.textContent+=str+"\n";
    }

    
    
    this.handleEvent = function(e) {
	//alert("You pressed: which="+e.which+",keyUniCode="+e.keyCode+",shift="+e.shiftKey+",charCode="+e.charCode+",tochar="+String.fromCharCode(e.which)+",type="+e.type);
	return msx.trataTecla.call(msx,e.keyCode, e.type=='keydown', e);
    }
    
    this.inb = function(i) {
	switch (i) {
	case 162:
	    if (this.psg != null)
		return this.psg.lePortaDados();
	    /* fall through */
	case 168:
	    return this.PPIPortA;
	case 169:
	    return this.estadoTeclas[this.PPIPortC & 0xf];
	case 170:
	    return this.PPIPortC;
	case 171:
	    return this.PPIPortD;
	case 152:
	    if (this.vdp != null)
		return this.vdp.lePortaDados();
	    /* fall through */
	case 153:
	    if (this.vdp != null)
		return this.vdp.lePortaComandos();
	    /* fall through */
	default:
	    if (this.portos[i] != -1)
		return this.portos[i];
	    return 255;
	}
    }

    this.interrupt = msx_interrupt;
    this.interrupt_start = function() {
        this.interval = setInterval('msx_interrupt.apply(msx)',17); //60 intervals/sec
    }
    this.interrupt_stop = function() {
        clearInterval(this.interval);
    }

    this.execute_start = function() {    
	this.exec_interval = setInterval('msx.execute.apply(msx)',17); //60 intervals/sec
    }
    this.execute_stop = function() {
	clearInterval(msx.exec_interval);
    }

    this.loadbiosrom = function(url, slot, canvasbiosrom) {
	this.println("Reading bios rom " + url);
	var biosrom = msx_loadurl(url);
	this.println(biosrom.length+" bytes read");

	if (biosrom != '') {
		canvasbiosrom.width=256;
		canvasbiosrom.height=biosrom.length/256;
		//alert(biosrom.length+','+canvasbiosrom.width+','+canvasbiosrom.height);
		var ctxbiosrom = canvasbiosrom.getContext("2d");
		ctxbiosrom.fillStyle="rgb(0,0,0)";
		ctxbiosrom.fillRect(0,0,canvasbiosrom.width,canvasbiosrom.height);
		var imgdatabiosrom = undefined;
		var dbr = undefined;
		if (ctxbiosrom.getImageData) {
		  imgdatabiosrom = ctxbiosrom.getImageData(0,0,canvasbiosrom.width,canvasbiosrom.height);
		  dbr = imgdatabiosrom.data;
		}
		var biosromlength = biosrom.length;
		// MimeType('application/octet-stream; charset=x-user-defined')
		var charcode=0;	
		for (var i=0; i < biosromlength ; i++) {
			charcode = biosrom.charCodeAt(i) & 0xff;
			this.memoria[slot][i]=charcode;
			if (dbr) {
			  dbr[i*4]=charcode;
			  dbr[i*4+1]=charcode;
			  dbr[i*4+2]=charcode;
			} else {
			  ctxbiosrom.fillStyle="rgb("+charcode+","+charcode+","+charcode+")";
			  ctxbiosrom.fillRect(i%canvasbiosrom.width,Math.floor(i/canvasbiosrom.width),1,1);
			}
		}
		if (ctxbiosrom.putImageData) {
		  ctxbiosrom.putImageData(imgdatabiosrom,0,0);
		}
	}
	return biosrom;
    }

    this.loadcartrom = function(url, cartslot, megaromtype, canvascartrom) {

	this.println("Reading cart rom " + url);
	var cartrom = msx_loadurl(url);
	this.println(cartrom.length+" bytes read");

	if (cartrom != '') {
		canvascartrom.width=256;
		canvascartrom.height=cartrom.length/256;
		//alert(cartrom.length+','+canvascartrom.width+','+canvascartrom.height);
		var ctxcartrom = canvascartrom.getContext("2d");
		ctxcartrom.fillStyle="rgb(0,0,0)";
		ctxcartrom.fillRect(0,0,canvascartrom.width,canvascartrom.height);
		var imgdatacartrom = undefined;
		var dbr = undefined;
		if (ctxcartrom.getImageData) {
		  imgdatacartrom = ctxcartrom.getImageData(0,0,canvascartrom.width,canvascartrom.height);
		  dbr = imgdatacartrom.data;
		} else {
		  dbr = new Array(canvascartrom.width * canvascartrom.height * 4);
		}
		var cartromlength = cartrom.length;
		// MimeType('application/octet-stream; charset=x-user-defined')
		var charcode=0;	
		for (var i=0; i < cartromlength ; i++) {
			charcode = cartrom.charCodeAt(i) & 0xff;
			//this.memoria[slot][i]=charcode;
			dbr[i*4]=charcode;
			dbr[i*4+1]=charcode;
			dbr[i*4+2]=charcode;
			if (!ctxcartrom.getImageData) {
			  ctxcartrom.fillStyle="rgb("+charcode+","+charcode+","+charcode+")";
			  ctxcartrom.fillRect(i%canvascartrom.width,Math.floor(i/canvascartrom.width),1,1);
			}
		}
		if (ctxcartrom.putImageData) {
		  ctxcartrom.putImageData(imgdatacartrom,0,0);
		}
	}

	var i_9_ = 0;
	bool = false;
	i = cartslot;
	var is = dbr;
	{
		var i_12_ = cartrom.length; 

		for (var i_13_ = 0; i_13_ < i_12_; i_13_++) {
		    var i_14_ = Math.floor(i_13_ / 8192);
		    this.cart[i_14_][i_13_ % 8192] = is[i_13_*4] + 256 & 0xff;
		}
		if (i_12_ > 0)
		    i_9_ = (is[3*4]<0?is[3*4]+256:is[3*4]) * 256 + (is[2*4]<0?is[2*4]+256:is[2*4]);
		if (i_9_ < 8192) {
		    i_9_ = 0;
		    this.PPIPortC = 250;
		} else if (i_9_ < 16384)
		    i_9_ = 8192;
		else if (i_9_ < 32768)
		    i_9_ = 16384;
		else
		    i_9_ = 32768;
		this.println("Cart start address:" + i_9_);
		if (i_12_ > 32768) {
		    i_12_ = 16384;
		    this.megarom = true;
		    this.preparaMemoriaMegarom(megaromtype);
		    this.println("Megarom type " + megaromtype);
		}
		for (var i_15_ = 0; i_15_ < i_12_; i_15_++)
		    this.memoria[i][i_15_ + i_9_] = is[i_15_*4] + 256 & 0xff;
	} 
	return cartrom;
    }

    this.outb = function(i, i_19_, i_20_) {
	switch (i) {
	case 142:
	    this.megarom = true;
	    this.println("Megarom mode");
	    break;
	case 160:
	    if (this.psg != null)
		this.psg.escrevePortaEndereco(i_19_);
	    break;
	case 161:
	    if (this.psg != null)
		this.psg.escrevePortaDados(i_19_);
	    break;
	case 168:
	    this.PPIPortA = i_19_;
	    break;
	case 169:
	    this.PPIPortB = i_19_;
	    break;
	case 170:
	    this.PPIPortC = i_19_;
	    break;
	case 171:
	    this.PPIPortD = i_19_;
	    break;
	case 152:
	    if (this.vdp != null)
		this.vdp.escrevePortaDados(i_19_);
	    break;
	case 153:
	    if (this.vdp != null)
		this.vdp.escrevePortaComandos(i_19_);
	    break;
	default:
	    this.portos[i] = i_19_;
	}
    }
    
    this.peekb = function(i) {
	var i_21_ = 0;
	switch ((i & 0xc000) >> 14) {
	case 0:
	    i_21_ = this.PPIPortA & 0x3;
	    break;
	case 1:
	    i_21_ = (this.PPIPortA & 0xc) >> 2;
	    break;
	case 2:
	    i_21_ = (this.PPIPortA & 0x30) >> 4;
	    break;
	case 3:
	    i_21_ = (this.PPIPortA & 0xc0) >> 6;
	    break;
	default:
	    i_21_ = 0;
	}
	var i_22_ = 0;
	if (i_21_ == this.cartSlot && this.megarom && i <= 49151 && i >= 16384)
	    i_22_ = this.cart[this.pagMegaRom[Math.floor(i / 8192) - 2]][i % 8192];
	else
	    i_22_ = this.memoria[i_21_][i];

	return i_22_;
    }
    
    this.peekw = function(i) {
	var i_23_ = 0;
	switch ((i & 0xc000) >> 14) {
	case 0:
	    i_23_ = this.PPIPortA & 0x3;
	    break;
	case 1:
	    i_23_ = (this.PPIPortA & 0xc) >> 2;
	    break;
	case 2:
	    i_23_ = (this.PPIPortA & 0x30) >> 4;
	    break;
	case 3:
	    i_23_ = (this.PPIPortA & 0xc0) >> 6;
	    break;
	default:
	    i_23_ = 0;
	}
	var i_24_ = 0;
	if (i_23_ == this.cartSlot && this.megarom && i >= 16384 && i < 49152) {
	    i_24_ = this.cart[this.pagMegaRom[Math.floor(i / 8192) - 2]][i % 8192];
	    i++;
	    i_24_ = this.cart[this.pagMegaRom[Math.floor(i / 8192) - 2]][i % 8192] << 8 | i_24_;
	} else {
	    i_24_ = this.memoria[i_23_][i];
	    i++;
	    i_24_ = this.memoria[i_23_][i] << 8 | i_24_;
	}
	return i_24_;
    }
    
    this.pokeb = function(i, i_25_) {
	var i_26_ = 0;
	switch ((i & 0xc000) >> 14) {
	case 0:
	    i_26_ = this.PPIPortA & 0x3;
	    break;
	case 1:
	    i_26_ = (this.PPIPortA & 0xc) >> 2;
	    break;
	case 2:
	    i_26_ = (this.PPIPortA & 0x30) >> 4;
	    break;
	case 3:
	    i_26_ = (this.PPIPortA & 0xc0) >> 6;
	    break;
	default:
	    i_26_ = 0;
	}
	if (this.megarom && i_26_ == this.cartSlot) {
	    switch (this.tipoMegarom) {
	    case 0:
		if (i == 16384 || i == 20480)
		    this.pagMegaRom[0] = i_25_ & 0xff;
		else if (i == 24576 || i == 28672)
		    this.pagMegaRom[1] = i_25_ & 0xff;
		else if (i == 32768 || i == 36864)
		    this.pagMegaRom[2] = i_25_ & 0xff;
		else if (i == 40960 || i == 45056)
		    this.pagMegaRom[3] = i_25_ & 0xff;
		break;
	    case 1:
		if (i == 16384 || i == 20480) {
		    this.pagMegaRom[0] = i_25_ & 0xff;
		    this.pagMegaRom[1] = this.pagMegaRom[0] + 1;
		} else if (i == 32768 || i == 36864) {
		    this.pagMegaRom[2] = i_25_ & 0xff;
		    this.pagMegaRom[3] = this.pagMegaRom[2] + 1;
		}
		break;
	    case 2:
		if (i >= 24576 && i <= 26623)
		    this.pagMegaRom[0] = i_25_ & 0xff;
		else if (i >= 26624 && i <= 28671)
		    this.pagMegaRom[1] = i_25_ & 0xff;
		else if (i >= 28672 && i <= 30719)
		    this.pagMegaRom[2] = i_25_ & 0xff;
		else if (i >= 30720 && i <= 32767)
		    this.pagMegaRom[3] = i_25_ & 0xff;
		break;
	    case 3:
		if (i >= 24576 && i <= 26623) {
		    this.pagMegaRom[0] = i_25_ & 0xff;
		    this.pagMegaRom[1] = this.pagMegaRom[0] + 1;
		} else if (i >= 28672 && i <= 30719) {
		    this.pagMegaRom[2] = i_25_ & 0xff;
		    this.pagMegaRom[3] = this.pagMegaRom[2] + 1;
		}
		break;
	    }
	}
	if (this.podeEscrever[i_26_])
	    this.memoria[i_26_][i] = i_25_ & 0xff;
	if (i == 65535)
	    this.memoria[i_26_][65535] = 255;
    }
    
    this.pokew = function(i, i_27_) {
	var i_28_ = 0;
	switch ((i & 0xc000) >> 14) {
	case 0:
	    i_28_ = this.PPIPortA & 0x3;
	    break;
	case 1:
	    i_28_ = (this.PPIPortA & 0xc) >> 2;
	    break;
	case 2:
	    i_28_ = (this.PPIPortA & 0x30) >> 4;
	    break;
	case 3:
	    i_28_ = (this.PPIPortA & 0xc0) >> 6;
	    break;
	default:
	    i_28_ = 0;
	}
	if (this.megarom && i_28_ == this.cartSlot) {
	    switch (this.tipoMegarom) {
	    case 0:
		if (i == 16384 || i == 20480)
		    this.pagMegaRom[0] = i_27_ & 0xff;
		else if (i == 24576 || i == 28672)
		    this.pagMegaRom[1] = i_27_ & 0xff;
		else if (i == 32768 || i == 36864)
		    this.pagMegaRom[2] = i_27_ & 0xff;
		else if (i == 40960 || i == 45056)
		    this.pagMegaRom[3] = i_27_ & 0xff;
		else if (i == 24575 || i == 28671)
		    this.pagMegaRom[1] = i_27_ & 0xff;
		else if (i == 32767 || i == 36863)
		    this.pagMegaRom[2] = i_27_ & 0xff;
		else if (i == 40959 || i == 45055)
		    this.pagMegaRom[3] = i_27_ & 0xff;
		break;
	    case 1:
		if (i == 16384 || i == 20480) {
		    this.pagMegaRom[0] = i_27_ & 0xff;
		    this.pagMegaRom[1] = this.pagMegaRom[0] + 1;
		} else if (i == 32768 || i == 36864) {
		    this.pagMegaRom[2] = i_27_ & 0xff;
		    this.pagMegaRom[3] = this.pagMegaRom[2] + 1;
		} else if (i == 16383 || i == 20479) {
		    this.pagMegaRom[0] = i_27_ >> 8 & 0xff;
		    this.pagMegaRom[1] = this.pagMegaRom[0] + 1;
		} else if (i == 24575 || i == 28671) {
		    this.pagMegaRom[0] = i_27_ & 0xff;
		    this.pagMegaRom[1] = this.pagMegaRom[0] + 1;
		    this.pagMegaRom[2] = i_27_ >> 8 & 0xff;
		    this.pagMegaRom[3] = this.pagMegaRom[2] + 1;
		}
		break;
	    case 2:
		if (i >= 24576 && i < 26623)
		    this.pagMegaRom[0] = i_27_ & 0xff;
		else if (i >= 26624 && i < 28671)
		    this.pagMegaRom[1] = i_27_ & 0xff;
		else if (i >= 28672 && i < 30719)
		    this.pagMegaRom[2] = i_27_ & 0xff;
		else if (i >= 30720 && i < 32767)
		    this.pagMegaRom[3] = i_27_ & 0xff;
		else if (i == 24575)
		    this.pagMegaRom[0] = i_27_ >> 8 & 0xff;
		else if (i == 26623) {
		    this.pagMegaRom[0] = i_27_ & 0xff;
		    this.pagMegaRom[1] = i_27_ >> 8 & 0xff;
		} else if (i == 28671) {
		    this.pagMegaRom[1] = i_27_ & 0xff;
		    this.pagMegaRom[2] = i_27_ >> 8 & 0xff;
		} else if (i == 30719) {
		    this.pagMegaRom[2] = i_27_ & 0xff;
		    this.pagMegaRom[3] = i_27_ >> 8 & 0xff;
		} else if (i == 32767)
		    this.pagMegaRom[3] = i_27_ & 0xff;
		break;
	    case 3:
		if (i >= 24576 && i <= 26623) {
		    this.pagMegaRom[0] = i_27_ & 0xff;
		    this.pagMegaRom[1] = this.pagMegaRom[0] + 1;
		} else if (i >= 28672 && i <= 30719) {
		    this.pagMegaRom[2] = i_27_ & 0xff;
		    this.pagMegaRom[3] = this.pagMegaRom[2] + 1;
		}
		break;
	    }
	}
	if (this.podeEscrever[i_28_]) {
	    this.memoria[i_28_][i] = i_27_ & 0xff;
	    if (++i < 65535)
		this.memoria[i_28_][i] = i_27_ >> 8;
	    if (i == 65535 || i == 65536)
		this.memoria[i_28_][65535] = 255;
	}
    }
    
    this.preparaMemoriaMegarom = function(string) {
	if (string != null) {
	    if (string == "0")
		this.tipoMegarom = 0;
	    else if (string == "1")
		this.tipoMegarom = 1;
	    else if (string == "2")
		this.tipoMegarom = 2;
	    else if (string == "3")
		this.tipoMegarom = 3;
	}
    }
    
    this.trataTecla = function(i, bool, e) {
	switch (i) { //UNICODE VALUE
	case 48: //0
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0xfe : this.estadoTeclas[0] | 0x1;
	    break;
	case 49: //1
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0xfd : this.estadoTeclas[0] | 0x2;
	    break;
	case 50: //2
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0xfb : this.estadoTeclas[0] | 0x4;
	    break;
	case 51: //3
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0xf7 : this.estadoTeclas[0] | 0x8;
	    break;
	case 52: //4
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0xef : this.estadoTeclas[0] | 0x10;
	    break;
	case 53: //5
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0xdf : this.estadoTeclas[0] | 0x20;
	    break;
	case 54: //6
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0xbf : this.estadoTeclas[0] | 0x40;
	    break;
	case 55: //7
	    this.estadoTeclas[0]
		= bool ? this.estadoTeclas[0] & 0x7f : this.estadoTeclas[0] | 0x80;
	    break;
	case 56: //8
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0xfe : this.estadoTeclas[1] | 0x1;
	    break;
	case 57: //9
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0xfd : this.estadoTeclas[1] | 0x2;
	    break;
	case 45: //-
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0xfb : this.estadoTeclas[1] | 0x4;
	    break;
	case 61: //^
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0xf7 : this.estadoTeclas[1] | 0x8;
	    break;
	case 92: //$
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0xef : this.estadoTeclas[1] | 0x10;
	    break;
	case 91: //@
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0xdf : this.estadoTeclas[1] | 0x20;
	    break;
	case 93: //(
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0xbf : this.estadoTeclas[1] | 0x40;
	    break;
	case 59: //;
	    this.estadoTeclas[1]
		= bool ? this.estadoTeclas[1] & 0x7f : this.estadoTeclas[1] | 0x80;
	    break;
	//case 34:
	//case 39:
	case 1013: //:
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0xfe : this.estadoTeclas[2] | 0x1;
	    break;
	case 48: //)
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0xfd : this.estadoTeclas[2] | 0x2;
	    break;
	case 188: //,
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0xfb : this.estadoTeclas[2] | 0x4;
	    break;
	case 190: //.
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0xf7 : this.estadoTeclas[2] | 0x8;
	    break;
	case 191: ///
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0xef : this.estadoTeclas[2] | 0x10;
	    break;
	case 109: //_
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0xdf : this.estadoTeclas[2] | 0x20;
	    break;
	case 65: //A
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0xbf : this.estadoTeclas[2] | 0x40;
	    break;
	case 66: //B
	    this.estadoTeclas[2]
		= bool ? this.estadoTeclas[2] & 0x7f : this.estadoTeclas[2] | 0x80;
	    break;
	case 67: //C
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0xfe : this.estadoTeclas[3] | 0x1;
	    break;
	case 68: //D
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0xfd : this.estadoTeclas[3] | 0x2;
	    break;
	case 69: //E
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0xfb : this.estadoTeclas[3] | 0x4;
	    break;
	case 70: //F
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0xf7 : this.estadoTeclas[3] | 0x8;
	    break;
	case 71: //G
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0xef : this.estadoTeclas[3] | 0x10;
	    break;
	case 72: //H
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0xdf : this.estadoTeclas[3] | 0x20;
	    break;
	case 73: //I
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0xbf : this.estadoTeclas[3] | 0x40;
	    break;
	case 74: //J
	    this.estadoTeclas[3]
		= bool ? this.estadoTeclas[3] & 0x7f : this.estadoTeclas[3] | 0x80;
	    break;
	case 75: //K
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0xfe : this.estadoTeclas[4] | 0x1;
	    break;
	case 76: //L
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0xfd : this.estadoTeclas[4] | 0x2;
	    break;
	case 77: //M
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0xfb : this.estadoTeclas[4] | 0x4;
	    break;
	case 78: //N
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0xf7 : this.estadoTeclas[4] | 0x8;
	    break;
	case 79: //O
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0xef : this.estadoTeclas[4] | 0x10;
	    break;
	case 80: //P
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0xdf : this.estadoTeclas[4] | 0x20;
	    break;
	case 81: //Q
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0xbf : this.estadoTeclas[4] | 0x40;
	    break;
	case 82: //R
	    this.estadoTeclas[4]
		= bool ? this.estadoTeclas[4] & 0x7f : this.estadoTeclas[4] | 0x80;
	    break;
	case 83: //S
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0xfe : this.estadoTeclas[5] | 0x1;
	    break;
	case 84: //T
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0xfd : this.estadoTeclas[5] | 0x2;
	    break;
	case 85: //U
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0xfb : this.estadoTeclas[5] | 0x4;
	    break;
	case 86: //V
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0xf7 : this.estadoTeclas[5] | 0x8;
	    break;
	case 87: //W
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0xef : this.estadoTeclas[5] | 0x10;
	    break;
	case 88: //X
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0xdf : this.estadoTeclas[5] | 0x20;
	    break;
	case 89: //Y
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0xbf : this.estadoTeclas[5] | 0x40;
	    break;
	case 90: //Z
	    this.estadoTeclas[5]
		= bool ? this.estadoTeclas[5] & 0x7f : this.estadoTeclas[5] | 0x80;
	    break;
	case 1017: 
	    if (bool == true)
		pauseAtNextInterrupt = pauseAtNextInterrupt ^ true;
	    break;
	case 1019: 
	    if (bool == true) {
		frameSkip++;
		frameSkip %= 20;
	    }
	    break;
	case 1018:
	    if (bool == true) {
		frameSkip--;
		if (frameSkip < 1)
		    frameSkip = 1;
	    }
	    break;
	case 16: //SHIFT
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0xfe : this.estadoTeclas[6] | 0x1;
	    break;
	case 17: //CTRL
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0xfd : this.estadoTeclas[6] | 0x2;
	    break;
	case 18: //GRAPH (ALT in PC)
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0xfb : this.estadoTeclas[6] | 0x4;
	    break;
	case 20: //CAP
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0xf7 : this.estadoTeclas[6] | 0x8;
	    break;
	case 118: //CODELOCK (F7 in PC)
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0xef : this.estadoTeclas[6] | 0x10;
	    break;
	case 112: //F1
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0xdf : this.estadoTeclas[6] | 0x20;
	    break;
	case 113: //F2
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0xbf : this.estadoTeclas[6] | 0x40;
	    break;
	case 114: //F3
	    this.estadoTeclas[6]
		= bool ? this.estadoTeclas[6] & 0x7f : this.estadoTeclas[6] | 0x80;
	    break;
	case 115: //F4
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0xfe : this.estadoTeclas[7] | 0x1;
	    break;
	case 116: //F5
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0xfd : this.estadoTeclas[7] | 0x2;
	    break;
	case 27: //ESC
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0xfb : this.estadoTeclas[7] | 0x4;
	    break;
	case 9: //TAB
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0xf7 : this.estadoTeclas[7] | 0x8;
	    break;
	case 19: //STOP
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0xef : this.estadoTeclas[7] | 0x10;
	    break;
	case 8: //BACKSPACE
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0xdf : this.estadoTeclas[7] | 0x20;
	    break;
	case 117: //SELECT (F6 in PC)
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0xbf : this.estadoTeclas[7] | 0x40;
	    break;
	case 13: //RETURN
	    this.estadoTeclas[7]
		= bool ? this.estadoTeclas[7] & 0x7f : this.estadoTeclas[7] | 0x80;
	    break;
	case 32: //SPACE
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0xfe : this.estadoTeclas[8] | 0x1;
	    break;
	case 36: //HOME
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0xfd : this.estadoTeclas[8] | 0x2;
	    break;
	case 45: //INSERT
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0xfb : this.estadoTeclas[8] | 0x4;
	    break;
	case 46: //DELETE
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0xf7 : this.estadoTeclas[8] | 0x8;
	    break;
	case 37: //LEFTARROW
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0xef : this.estadoTeclas[8] | 0x10;
	    break;
	case 38: //UPARROW
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0xdf : this.estadoTeclas[8] | 0x20;
	    break;
	case 40: //DOWNARROW
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0xbf : this.estadoTeclas[8] | 0x40;
	    break;
	case 39: //RIGHTARROW
	    this.estadoTeclas[8]
		= bool ? this.estadoTeclas[8] & 0x7f : this.estadoTeclas[8] | 0x80;
	    break;

	default: //browser should handle key event
	    return true;
	}

	e.returnValue = false;
	//e.cancelBubble = true;
	return false; //key event already handled
    }




    //local constructor
    //initializes local variables
    {
	this.println("Booting jsMSX");

	for (i = 0; i < 256; i++)
	    this.portos[i] = -1;
	this.estadoTeclas =  [ 255, 255, 255, 255, 255, 255, 255, 255, 255,
				   255, 255 ];
	this.podeEscrever = [ false, false, false, true ];
	this.pinta = true;
	this.cart = new Array(32); //2-dimensional array 32x8192 of cartridges
	for (i=0; i<32; i++) {
	    var acart = new Array(8192);
            //for (j=0; j<8192; j++) acart[j]=0;	
	    this.cart[i] = acart;
	}
	this.interruptCounter = 0;
	this.frameSkip = 1;
	this.sleepHack = 5;
	this.resetAtNextInterrupt = false;
	this.pauseAtNextInterrupt = false;
	this.refreshNextInterrupt = true;
	this.DipSwitchSYNC = 0;

	this.println("Starting RAM slots");
	this.memoria = new Array(4);
	this.m0 = new Array(65536);
	this.memoria[0] = this.m0;
	for (var i=0;i<65536;i++) this.m0[i]=255;
	this.m1 = new Array(65536);
	this.memoria[1] = this.m1;
	for (var i=0;i<65536;i++) this.m1[i]=255;
	this.m2 = new Array(65536);
	this.memoria[2] = this.m2;
	for (var i=0;i<65536;i++) this.m2[i]=255;
	this.m3 = new Array(65536);
	this.memoria[3] = this.m3;
	for (var i=0;i<65536;i++) this.m3[i]=255;
	this.reset();

	this.println("Starting VDP");
	this.vdp = new tms9918(this.canvas);

	this.println("Starting PSG (No Sound)");
	this.psg = new psg8910();

	this.println('interrupt='+this.interruptCounter+',ticks='+Math.floor(this.tstatesPerInterrupt)+' cpu ticks/interrupt, cpu clock=3.58 MHz');
	this.println('MSX ready to go. Load ROMs and hit [start].');
    }



}

msx_interrupt = function()
{

	if (msx.resetAtNextInterrupt) {
	    msx.resetAtNextInterrupt = false;
	    msx.reset();
	}
	if (msx.vdp.imagedata)
	  msx.vdp.imagedata.data[msx.interruptCounter*4+1]=255;//green line
	
	document.getElementById('interrupts').value=msx.interruptCounter;
	//if (msx.interruptCounter%600==0) 
	//msx.println('interrupt='+msx.interruptCounter+',ticks='+this.tstatesPerInterrupt+' cpu ticks/interrupt');
	msx.interruptCounter++;

	msx.DipSwitchSYNC = 1;
	if (msx.pinta) {
	    msx.vdp.updateScreen();
	    msx.pinta = false;
	}
	if (msx.interruptCounter % msx.frameSkip == 0)
	    msx.vdp.montaUsandoMemoria();

	//return msx.superclass.interrupt();
	//calls superclass' interrupt() in msx context/scope.
	return msx.z80_interrupt.apply(msx); 

}


msx_loadurl = function(url) {
	//alert(url);
	var io = new browserio();
	var data = io.load(url);
	//alert(data);
	return data; 
}


