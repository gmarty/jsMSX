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

function psg8910()
{
    this.enderecoAtual = 0;
    this.registros = new Array(16);
    
    this.escrevePortaDados = function(i) {
	this.registros[this.enderecoAtual] = i;
	if (this.enderecoAtual == 7)
	    this.registros[this.enderecoAtual] |= 0x80;
    }
    
    this.escrevePortaEndereco = function(i) {
	if (i < 17)
	    this.enderecoAtual = i;
    }
    
    this.lePortaDados = function() {
	if (this.enderecoAtual != 14)
	    return this.registros[this.enderecoAtual];
	return 255;
    }
    
    this.psg8910 = function() {
	/* empty */
    }
}
