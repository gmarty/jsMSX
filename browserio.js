
/* JSMSX - MSX Emulator in Javascript
 * Copyright (c) 2006 Marcus Granado <mrc.gran(@)gmail.com>
 *
 * This file contains I/O file functions for reading
 * and writing data supporting a range of mainstream web browsers.
 *
 * Each web browser seems to have its unique way of 
 * performing I/O, and therefore a different function
 * is required for each of them.
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

function browserio() {

  this.load = function(url)
  {
	//1) let's try the ff way of reading i/o data.
	var data = this.ffLoad(url);
	//2) ff i/o didn't work: let's try the ie way.
	if (data=='') data= this.ieLoad(url);
	return data;
  }

  this.ffLoad = function(url)
  {
	var data = '';
	var i = url.indexOf(":");
	var prot = '';
	if (i>-1) prot= url.substring(0,i);
	else {  prot='file';//default protocol
		url+='file://';//adds file prefix by default
	}
	try {
	    if (prot=="http" || prot=="https") { // http fetch

	        netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead");
        	var req = new XMLHttpRequest();
        	req.open('GET', url, false);
        	// charset opt by Marcus Granado 2006 [mgran.blogspot.com]
        	req.overrideMimeType('text/plain; charset=x-user-defined');
        	req.send(null);
        	if(req.status != 200) return '';
        	data=req.responseText;

	    } else { //default: local file fetch

		//removes prefix 'file://'		
		url = url.substring(i+3,url.length); 
		//alert(url);
		netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
		var f = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		f.initWithPath(url);//absolute file path
		if (!f.exists()) { return ''; }
		var is = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
		is.init(f, 0x01, 00004, null);
		var bis = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
		bis.setInputStream(is);
		var datasize = is.available();
		for (var i=0; i<datasize; i++) {
			data+=String.fromCharCode(bis.read8());
		} 
	    }
	} catch(e) { alert("ffLoad: error loading "+url+":"+ e); return '' }
	return data;
  }

  this.ieLoad = function(url) {
	var data = '';
	var i = url.indexOf(":");
	var prot = '';
	if (i>-1) prot= url.substring(0,i);
	else {  prot='file';//default protocol
		url+='file://';//adds file prefix by default
	}
	if (prot=="http" || prot=="https") { // http fetch

	  //...	

	} else { //default: local file fetch

	  try {
	    var fso = new ActiveXObject("Scripting.FileSystemObject");
	    var f = fso.OpenTextFile(url,1);
	    data = f.ReadAll();
	    f.Close();

	  } catch(e) {
	    alert("ieLoad: error loading "+url+":"+e.toString()); 
	    return '';
	  }
	}
	return data;
  }

}

