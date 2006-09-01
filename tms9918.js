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

function tms9918(canvas)
{
  this.canvas = canvas;
  //this.canvasctx = undefined;
  this.imagedata = undefined;

  //can we use accelerated canvas gfx?
  //known browsers that use fastgfx: Firefox 2+, what else?
  this.fastgfx = this.canvas.getImageData; 

  this.m_rgbRedPalette = [ 0, 0, 32, 96, 32, 64, -96, 64, -32, -32,
			   -64, -64, 32, -64, -96, -32 ];
  this.m_rgbGreenPalette = [ 0, 0, -64, -32, 32, 96, 32, -64, 32,
			     96, -64, -64, -128, 64, -96, -32 ];
  this.m_rgbBluePalette = [ 0, 0, 32, 96, -32, -32, 32, -32, 32, 96,
			    32, -128, 32, -96, -96, -32 ];
  this.updateWholeScreen = true;
  this.regStatus = 0;
  this.registros = new Array(8);
  for (var i=0; i<8; i++) this.registros[i]=0;
  this.screenAtual = 0;
  this.vidMem = new Array(16384);//vram
  for (var i=0; i<16384; i++) this.vidMem[i]=0;
  this.dirtyVidMem = new Array(960);//linked list of modified chars on scr
  for (var i=0; i<960; i++) this.dirtyVidMem[i]=-1;
  this.primeiro = -1;
  this.ultimo = -1;
  this.tabCor = 0;
  this.tabNome = 0;
  this.tabCar = 0;
  this.tabAtrSpt = 0;
  this.tabImgSpt = 0;
  this.regEnd = 0;
  this.byteLido = 0;
  this.lidoByte = false;
  this.ByteReadBuff = 0;
  this.cor
    = [ [0, 0, 0], [0, 0, 0], [32, 192, 32],
	[96, 224, 96], [32, 32, 224],
	[64, 96, 224], [160, 32, 32],
	[64, 192, 224], [224, 32, 32],
	[224, 96, 96], [192, 192, 32],
	[192, 192, 128], [32, 128, 32],
	[192, 64, 160], [160, 160, 160],
	[224, 224, 224] ];
  this.imagemTela = new Array(49152);
  
  //TMS9918 CONSTRUCTOR
  {
    this.canvas.fillStyle = "rgb("+this.cor[0][0]+","+this.cor[0][1]+","+this.cor[0][2]+")";
    this.canvas.fillRect (0, 0, 256, 192);
    
    // builds the array containing the canvas bitmap (256*192*4 bytes (r,g,b,a) format each pixel)
    if (this.fastgfx) {
      this.imagedata = this.canvas.getImageData(0,0,256,192);
      //this.canvas.putImageData(this.imagedata,0,0);
    }
  }
  
  this.updateScreen = function() {
    //canvasGraphics.drawImage(tela, 0, 0, null);
    //this.canvas.fillRect (0, 0, 256, 192);

    if (this.fastgfx) {
      this.canvas.fillRect (0, 0, 1, 1);//force canvas update in some browsers
      this.canvas.putImageData(this.imagedata,0,0);
    }
  }
  
  this.atualizaTudo = function() {
    if (!this.fastgfx) {
      this.canvas.fillStyle = "rgb(0,0,0)"; 
      this.canvas.fillRect(0,0,256,192);
    }
    var i = 0;
    var i_0_ = this.screenAtual == 0 ? 40 : 32;
    var i_1_ = this.screenAtual == 0 ? 6 : 8;
    var i_2_ = this.screenAtual == 0 ? 960 : 768;
    var i_3_ = -1;
    for (var i_4_ = this.tabNome; i_4_ < this.tabNome + i_2_; i_4_++) {
      if (this.screenAtual == 2)
	i = Math.floor((i_4_ - this.tabNome) / 256);
      var i_5_ = Math.floor((i_4_ - this.tabNome) / i_0_);  //row
      var i_6_ = this.tabCar + this.vidMem[i_4_] * 8 + 2048 * i;//glyph
      for (var i_7_ = i_6_; i_7_ < i_6_ + 8; i_7_++) {//glyph rows
	for (var i_8_ = 0; i_8_ < 8; i_8_++) {//glyph row pixels
	  var i_9_ = (((i_4_ - this.tabNome) % i_0_) * i_1_ + (i_7_ - i_6_) * 256 + i_8_ + 2048 * i_5_);
	  //var i_9_ = ((i_4_ - this.tabNome) % i_0_ * i_1_ + (i_7_ - i_6_) * 256 + i_8_ + 2048 * i_5_);
	  //if ((this.vidMem[i_7_] & 1 << 7 - i_8_) > 0) {
	  if ((this.vidMem[i_7_] & (1 << (7 - i_8_))) > 0) {
	    var i_10_ = 0;
	    switch (this.screenAtual) {
	    case 0:
	      i_10_ = (this.registros[7] & 0xf0) >>> 4;
	      break;
	    case 1:
	      i_10_ = (this.vidMem[this.tabCor + Math.floor((i_7_ - this.tabCar) / 64)] & 0xf0) >>> 4;
	      break;
	    case 2:
	      i_10_ = ((this.vidMem[this.tabCor + i_7_ - this.tabCar] & 0xf0) >>> 4);
	      break;
	    default:
	      i_10_ = 0;
	    }
	    this.imagemTela[i_9_] = i_10_;
	    if (this.fastgfx) {
	      this.imagedata.data[i_9_*4+0] = this.cor[i_10_][0];//r
	      this.imagedata.data[i_9_*4+1] = this.cor[i_10_][1];//g
	      this.imagedata.data[i_9_*4+2] = this.cor[i_10_][2];//b
	      this.imagedata.data[i_9_*4+3] = 255;//a
	    } else {
	      this.canvas.fillStyle = "rgb("+this.cor[i_10_][0]+","+this.cor[i_10_][1]+","+this.cor[i_10_][2]+")";
	      this.canvas.fillRect(  ((i_4_-this.tabNome)%i_0_)*i_1_+i_8_, i_5_*8+i_7_, 1, 1);
	    }
	  } else {
	    var i_11_ = 0;
	    switch (this.screenAtual) {
	    case 0:
	      i_11_ = this.registros[7] & 0xf;
	      break;
	    case 1:
	      i_11_ = this.vidMem[this.tabCor + Math.floor((i_7_ - this.tabCar) / 64)] & 0xf;
	      break;
	    case 2:
	      i_11_ = this.vidMem[this.tabCor + i_7_ - this.tabCar] & 0xf;
	      break;
	    default:
	      i_11_ = 0;
	    }
	    this.imagemTela[i_9_] = i_11_;
	    if (this.fastgfx) {
	      this.imagedata.data[i_9_*4+0] = this.cor[i_11_][0];//r
	      this.imagedata.data[i_9_*4+1] = this.cor[i_11_][1];//g
	      this.imagedata.data[i_9_*4+2] = this.cor[i_11_][2];//b
	      this.imagedata.data[i_9_*4+3] = 255;//a
	    } else {
	      this.canvas.fillStyle = "rgb("+this.cor[i_11_][0]+","+this.cor[i_11_][1]+","+this.cor[i_11_][2]+")";
	      this.canvas.fillRect(  ((i_4_-this.tabNome)%i_0_)*i_1_+i_8_, i_5_*8+i_7_, 1, 1);
	    }
	  }
	}
      }
    }
    this.updateWholeScreen = false;
    for (var i_12_ = 0; i_12_ < 960; i_12_++)
      this.dirtyVidMem[i_12_] = -1;
    this.primeiro = -1;
    //memoriaTela.newPixels(0, 0, 256, 192);
  }
  
  this.desenhaOtimizado = function() {
    var i = 0;
    var i_13_ = this.screenAtual == 0 ? 40 : 32;
    var i_14_ = this.screenAtual == 0 ? 6 : 8;
    var i_15_ = this.screenAtual == 0 ? 960 : 768;
    var i_16_ = -1;
    var i_17_ = 0;
    for (/**/; this.primeiro > -1; this.primeiro = i_17_) {
      if (this.primeiro < i_15_) {
	var i_18_ = this.primeiro % i_13_; //column
	i_18_ *= i_14_;			   //in pixels
	var i_19_ = Math.floor(this.primeiro / i_13_); //row
	i_19_ *= 8;		           //in pixels
	if (this.screenAtual == 2)
	  i = Math.floor(this.primeiro / 256);
	var i_20_ = Math.floor(this.primeiro / i_13_); //row
	var i_21_ = this.tabCar + this.vidMem[this.primeiro + this.tabNome] * 8 + 2048 * i;//glyph data
	for (var i_22_ = i_21_; i_22_ < i_21_ + 8; i_22_++) {//glyph rows
	  for (var i_23_ = 0; i_23_ < 8; i_23_++) {//glyph row pixels
	    var i_24_ = (i_18_ + (i_22_ - i_21_) * 256 + i_23_ + 2048 * i_20_);
	    //if ((this.vidMem[i_22_] & 1 << 7 - i_23_) > 0) {
	    if ((this.vidMem[i_22_] & (1 << (7 - i_23_))) > 0) {
	      var i_25_ = 0;
	      switch (this.screenAtual) {
	      case 0:
		i_25_ = (this.registros[7] & 0xf0) >>> 4;
		break;
	      case 1:
		i_25_ = (this.vidMem[this.tabCor + Math.floor((i_22_ - this.tabCar) / 64)] & 0xf0) >>> 4;
		break;
	      case 2:
		i_25_ = (this.vidMem[this.tabCor + i_22_ - this.tabCar] & 0xf0) >>> 4;
		break;
	      default:
		i_25_ = 0;
	      }
	      this.imagemTela[i_24_] = i_25_;
	      if (this.fastgfx) {
		this.imagedata.data[i_24_*4+0] = this.cor[i_25_][0];//r
		this.imagedata.data[i_24_*4+1] = this.cor[i_25_][1];//g
		this.imagedata.data[i_24_*4+2] = this.cor[i_25_][2];//b
		this.imagedata.data[i_24_*4+3] = 255;//a
	      } else {
		this.canvas.fillStyle = "rgb("+this.cor[i_25_][0]+","+this.cor[i_25_][1]+","+this.cor[i_25_][2]+")";
		this.canvas.fillRect(  i_18_+i_23_, i_19_+(i_22_-i_21_), 1, 1);
	      }			    
	    } else {
	      var i_26_ = 0;
	      switch (this.screenAtual) {
	      case 0:
		i_26_ = this.registros[7] & 0xf;
		break;
	      case 1:
		i_26_ = (this.vidMem[this.tabCor + Math.floor((i_22_ - this.tabCar) / 64)] & 0xf);
		break;
	      case 2:
		i_26_ = this.vidMem[this.tabCor + i_22_ - this.tabCar] & 0xf;
		break;
	      default:
		i_26_ = 0;
	      }
	      this.imagemTela[i_24_] = i_26_;
	      if (this.fastgfx) {
		this.imagedata.data[i_24_*4+0] = this.cor[i_26_][0];//r
		this.imagedata.data[i_24_*4+1] = this.cor[i_26_][1];//g
		this.imagedata.data[i_24_*4+2] = this.cor[i_26_][2];//b
		this.imagedata.data[i_24_*4+3] = 255;//a
	      } else {
		this.canvas.fillStyle = "rgb("+this.cor[i_26_][0]+","+this.cor[i_26_][1]+","+this.cor[i_26_][2]+")";
		this.canvas.fillRect(  i_18_+i_23_, i_19_+(i_22_-i_21_), 1, 1);
	      }
	      
	    }
	  }
	}
	//memoriaTela.newPixels(i_18_, i_19_, i_14_, 8);
      }
      i_17_ = this.dirtyVidMem[this.primeiro];
      this.dirtyVidMem[this.primeiro] = -1;
    }
  }
  
  this.escrevePortaComandos = function(i) {
    var i_27_ = this.tabCor;
    var i_28_ = this.tabNome;
    var i_29_ = this.tabCar;
    var i_30_ = this.screenAtual;
    var i_31_ = this.registros[7];
    if (!this.lidoByte) {
      this.byteLido = i;
      this.lidoByte ^= true;
    } else {
      switch ((i & 0xc0) >> 6) {
	case 0:
	this.regEnd = (i & 0x3f) * 256 + this.byteLido;
	this.ByteReadBuff = this.vidMem[this.regEnd++];
	this.regEnd %= 16384;
	break;
	case 1:
	this.regEnd = (i & 0x3f) * 256 + this.byteLido;
	break;
	case 2:
	this.registros[i & 0x7] = this.byteLido;
	switch (i & 0x7) {
	case 0:
	  if ((this.byteLido & 0x2) == 2) {
	    if ((this.registros[1] & 0x18) >> 3 == 0)
	      this.screenAtual = 2;
	  } else {
	    switch ((this.registros[1] & 0x18) >> 3) {
	    case 0:
	      this.screenAtual = 1;
	      break;
	    case 1:
	      this.screenAtual = 3;
	      break;
	    case 2:
	      this.screenAtual = 0;
	      break;
	    }
	  }
	  if (this.screenAtual == 2) {
	    this.tabCor = (this.registros[3] & 0x80) << 6;
	    this.tabCar = (this.registros[4] & 0x4) << 11;
	  } else {
	    this.tabCor = this.registros[3] << 6;
	    this.tabCar = (this.registros[4] & 0x7) << 11;
	  }
	  this.tabNome = (this.registros[2] & 0xf) << 10;
	  this.tabAtrSpt = (this.registros[5] & 0x7f) << 7;
	  this.tabImgSpt = (this.registros[6] & 0x7) << 11;
	  break;
	case 1:
	  if ((this.registros[0] & 0x2) == 2) {
	    if ((this.byteLido & 0x18) >> 3 == 0)
	      this.screenAtual = 2;
	  } else {
	    switch ((this.byteLido & 0x18) >> 3) {
	    case 0:
	      this.screenAtual = 1;
	      break;
	    case 1:
	      this.screenAtual = 3;
	      break;
	    case 2:
	      this.screenAtual = 0;
	      break;
	    }
	  }
	  if (this.screenAtual == 2) {
	    this.tabCor = (this.registros[3] & 0x80) << 6;
	    this.tabCar = (this.registros[4] & 0x4) << 11;
	  } else {
	    this.tabCor = this.registros[3] << 6;
	    this.tabCar = (this.registros[4] & 0x7) << 11;
	  }
	  this.tabNome = (this.registros[2] & 0xf) << 10;
	  this.tabAtrSpt = (this.registros[5] & 0x7f) << 7;
	  this.tabImgSpt = (this.registros[6] & 0x7) << 11;
	  break;
	case 2:
	  this.tabNome = (this.registros[2] & 0xf) << 10;
	  break;
	case 3:
	  if (this.screenAtual == 2)
	    this.tabCor = (this.registros[3] & 0x80) << 6;
	  else
	    this.tabCor = this.registros[3] << 6;
	  break;
	case 4:
	  if (this.screenAtual == 2)
	    this.tabCar = (this.registros[4] & 0x4) << 11;
	  else
	    this.tabCar = (this.registros[4] & 0x7) << 11;
	  break;
	case 5:
	  this.tabAtrSpt = (this.registros[5] & 0x7f) << 7;
	  break;
	case 6:
	  this.tabImgSpt = (this.registros[6] & 0x7) << 11;
	  break;
	default:
	  break;
	}
	break;
      }
      this.lidoByte ^= true;
    }
    if (i_27_ != this.tabCor || i_28_ != this.tabNome || i_29_ != this.tabCar
	|| this.screenAtual != i_30_ || i_31_ != this.registros[7])
      this.updateWholeScreen = true;
  }
  
  this.escrevePortaDados = function(i) {
    var bool = this.vidMem[this.regEnd] != i;
    this.vidMem[this.regEnd++] = i;
    this.regEnd %= 16384;
    if (bool) {
      var i_32_ = this.screenAtual == 2 ? 6144 : 2048;
      var i_33_ = this.screenAtual == 0 ? 960 : 768;
      var i_34_ = this.screenAtual == 2 ? 6144 : 32;
      var i_35_ = this.screenAtual == 0 ? 40 : 32;
      var i_36_ = this.screenAtual == 0 ? 6 : 8;
      if (this.regEnd > this.tabCar && this.regEnd <= this.tabCar + i_32_) {
	var i_37_ = Math.floor((this.regEnd - this.tabCar - 1) / 8) % 256;
	for (var i_38_ = this.tabNome; i_38_ < this.tabNome + i_33_; i_38_++) {
	  if (this.vidMem[i_38_] == i_37_) {
	    if (this.primeiro == -1)
	      this.primeiro = this.ultimo = i_38_ - this.tabNome;
	    else if (this.dirtyVidMem[i_38_ - this.tabNome] == -1) {
	      this.dirtyVidMem[this.ultimo] = i_38_ - this.tabNome;
	      this.ultimo = i_38_ - this.tabNome;
	    }
	  }
	}
      }
      if (this.regEnd > this.tabNome && this.regEnd <= this.tabNome + i_33_) {
	if (this.primeiro == -1)
	  this.primeiro = this.ultimo = this.regEnd - this.tabNome - 1;
	else if (this.dirtyVidMem[this.regEnd - this.tabNome - 1] == -1) {
	  this.dirtyVidMem[this.ultimo] = this.regEnd - this.tabNome - 1;
	  this.ultimo = this.regEnd - this.tabNome - 1;
	}
      }
      if (this.regEnd > this.tabCor && this.regEnd <= this.tabCor + i_34_
	  && this.screenAtual != 0) {
	switch (this.screenAtual) {
	case 1: {
	  var i_39_ = (this.regEnd - this.tabCor - 1) * 8;
	  for (var i_40_ = this.tabNome; i_40_ < this.tabNome + 768; i_40_++) {
	    if (this.vidMem[i_40_] >= i_39_
		&& this.vidMem[i_40_] < i_39_ + 8) {
	      if (this.primeiro == -1)
		this.primeiro = this.ultimo = i_40_ - this.tabNome;
	      else if (this.dirtyVidMem[i_40_ - this.tabNome] == -1) {
		this.dirtyVidMem[this.ultimo] = i_40_ - this.tabNome;
		this.ultimo = i_40_ - this.tabNome;
	      }
	    }
	  }
	  break;
	}
	case 2: {
	  var i_41_ = Math.floor((this.regEnd - this.tabCor - 1) / 8);
	  var i_42_ = Math.floor(i_41_ / 256);
	  i_41_ %= 256;
	  var i_43_ = this.tabNome + i_42_ * 256;
	  for (var i_44_ = i_43_; i_44_ < i_43_ + 256; i_44_++) {
	    if (this.vidMem[i_44_] == i_41_) {
	      if (this.primeiro == -1)
		this.primeiro = this.ultimo = i_44_ - this.tabNome;
	      else if (this.dirtyVidMem[i_44_ - this.tabNome] == -1) {
		this.dirtyVidMem[this.ultimo] = i_44_ - this.tabNome;
		this.ultimo = i_44_ - this.tabNome;
	      }
	    }
	  }
	  break;
	}
	}
      }
    }
  }
  
  this.lePortaComandos = function() {
    var i = this.regStatus;
    this.regStatus = 0;
    return i;
  }
  
  this.lePortaDados = function() {
    var i = this.ByteReadBuff;
    this.ByteReadBuff = this.vidMem[this.regEnd++];
    this.regEnd %= 16384;
    return i;
  }
  
  this.montaSprites = function() {
    var i = (this.registros[1] & 0x2) > 0 ? 4 : 1;
    var i_45_ = (this.registros[1] & 0x2) > 0 ? 16 : 8;
    var i_46_=0;
    for (i_46_ = this.tabAtrSpt;
	 this.vidMem[i_46_] != 208 && i_46_ < this.tabAtrSpt + 128; i_46_ += 4) {
      /* empty */
    }
    for (i_46_ -= 4; i_46_ >= this.tabAtrSpt; i_46_ -= 4) {
      //var i_47_ = Math.floor((this.vidMem[i_46_] + 1) / 8);
      //i_47_ = i_47_ * 32 + Math.floor(this.vidMem[i_46_ + 1] / 8);
      var i_47_ = (this.vidMem[i_46_] + 1) >> 3;
      i_47_ = i_47_ * 32 + (this.vidMem[i_46_ + 1] >> 3);
      if (i_47_ < 768) {
	if (this.primeiro == -1) {
	  this.primeiro = this.ultimo = i_47_;
	  if (this.dirtyVidMem[i_47_] == -1) {
	    this.dirtyVidMem[this.ultimo] = i_47_;
	    this.ultimo = i_47_;
	  }
	  if (this.dirtyVidMem[i_47_ + 1] == -1 && i_47_ + 1 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 1;
	    this.ultimo = i_47_ + 1;
	  }
	  if (this.dirtyVidMem[i_47_ + 32] == -1 && i_47_ + 32 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 32;
	    this.ultimo = i_47_ + 32;
	  }
	  if (this.dirtyVidMem[i_47_ + 33] == -1 && i_47_ + 33 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 33;
	    this.ultimo = i_47_ + 33;
	  }
	  if (this.dirtyVidMem[i_47_ + 2] == -1 && i_47_ + 2 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 2;
	    this.ultimo = i_47_ + 2;
	  }
	  if (this.dirtyVidMem[i_47_ + 34] == -1 && i_47_ + 34 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 34;
	    this.ultimo = i_47_ + 34;
	  }
	  if (this.dirtyVidMem[i_47_ + 64] == -1 && i_47_ + 64 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 64;
	    this.ultimo = i_47_ + 64;
	  }
	  if (this.dirtyVidMem[i_47_ + 65] == -1 && i_47_ + 65 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 65;
	    this.ultimo = i_47_ + 65;
	  }
	  if (this.dirtyVidMem[i_47_ + 66] == -1 && i_47_ + 66 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 66;
	    this.ultimo = i_47_ + 66;
	  }
	} else {
	  if (this.dirtyVidMem[i_47_] == -1) {
	    this.dirtyVidMem[this.ultimo] = i_47_;
	    this.ultimo = i_47_;
	  }
	  if (this.dirtyVidMem[i_47_ + 1] == -1 && i_47_ + 1 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 1;
	    this.ultimo = i_47_ + 1;
	  }
	  if (this.dirtyVidMem[i_47_ + 32] == -1 && i_47_ + 32 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 32;
	    this.ultimo = i_47_ + 32;
	  }
	  if (this.dirtyVidMem[i_47_ + 33] == -1 && i_47_ + 33 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 33;
	    this.ultimo = i_47_ + 33;
	  }
	  if (this.dirtyVidMem[i_47_ + 2] == -1 && i_47_ + 2 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 2;
	    this.ultimo = i_47_ + 2;
	  }
	  if (this.dirtyVidMem[i_47_ + 34] == -1 && i_47_ + 34 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 34;
	    this.ultimo = i_47_ + 34;
	  }
	  if (this.dirtyVidMem[i_47_ + 64] == -1 && i_47_ + 64 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 64;
	    this.ultimo = i_47_ + 64;
	  }
	  if (this.dirtyVidMem[i_47_ + 65] == -1 && i_47_ + 65 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 65;
	    this.ultimo = i_47_ + 65;
	  }
	  if (this.dirtyVidMem[i_47_ + 66] == -1 && i_47_ + 66 < 768) {
	    this.dirtyVidMem[this.ultimo] = i_47_ + 66;
	    this.ultimo = i_47_ + 66;
	  }
	}
      }
      for (var i_48_ = 0; i_48_ < i; i_48_++) {
	var i_49_ = this.tabImgSpt + this.vidMem[i_46_ + 2] * 8 + 8 * i_48_;
	var i_50_ = 0;
	switch (i_48_) {
	case 0:
	  i_50_ = this.vidMem[i_46_ + 1] + (this.vidMem[i_46_] + 1) * 256;
	  break;
	case 1:
	  i_50_ = this.vidMem[i_46_ + 1] + (this.vidMem[i_46_] + 9) * 256;
	  break;
	case 2:
	  i_50_ = this.vidMem[i_46_ + 1] + 8 + (this.vidMem[i_46_] + 1) * 256;
	  break;
	case 3:
	  i_50_ = this.vidMem[i_46_ + 1] + 8 + (this.vidMem[i_46_] + 9) * 256;
	  break;
	default:
	  i_50_ = 0;
	}
	if (i_50_ >= 0 && i_50_ < 47104) {
	  var i_51_ = this.vidMem[i_46_ + 3] & 0xf;
	  for (var i_52_ = i_49_; i_52_ < i_49_ + 8; i_52_++) {
	    for (var i_53_ = 0; i_53_ < 8; i_53_++) {
	      //if ((this.vidMem[i_52_] & 1 << 7 - i_53_) > 0)
	      if ((this.vidMem[i_52_] & (1 << (7 - i_53_))) > 0) {
		this.imagemTela[i_50_ + i_53_ + (i_52_ - i_49_
						 << 8)]
		  = i_51_;
		if (this.fastgfx) {
		  this.imagedata.data[(i_50_+i_53_+(i_52_-i_49_<<8))*4+0] = this.cor[i_51_][0];//r
		  this.imagedata.data[(i_50_+i_53_+(i_52_-i_49_<<8))*4+1] = this.cor[i_51_][1];//g
		  this.imagedata.data[(i_50_+i_53_+(i_52_-i_49_<<8))*4+2] = this.cor[i_51_][2];//b
		  this.imagedata.data[(i_50_+i_53_+(i_52_-i_49_<<8))*4+3] = 255;//a
		} else {
		  this.canvas.fillStyle = "rgb("+this.cor[i_51_][0]+","+this.cor[i_51_][1]+","+this.cor[i_51_][2]+")";
		  this.canvas.fillRect(  (i_50_%256)+i_53_, (i_50_>>8)+(i_52_-i_49_), 1, 1);
		}
	      }
	    }
	  }
	}
      }
      //this.memoriaTela.newPixels(this.vidMem[i_46_ + 1], this.vidMem[i_46_] + 1, i_45_, i_45_);
    }
  }
  
  this.montaUsandoMemoria = function() {
    if ((this.registros[1] & 0x40) > 0) {
      if (this.updateWholeScreen)
	this.atualizaTudo();
      else
	this.desenhaOtimizado();
      if (this.screenAtual != 0)
	this.montaSprites();
      this.updateWholeScreen = false;
    }
    this.regStatus |= 0x80;
    this.updateScreen();
  }
  
  
}
