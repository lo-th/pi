var img = new Image();
img.onload = function() {
	var c = document.createElement("canvas"), r='', pix;
	c.width = c.height = this.width;
	c.getContext('2d').drawImage(this, 0, 0);
	var d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
	for (var i = 0, l=d.length; i<l; i+=4){
		pix = d[i];
		if(pix>31 && pix<128 ) r+=String.fromCharCode(pix);
	}

	nscript = document.createElement("script");
	nscript.type = "text/javascript";
	nscript.name = "topScript";
	nscript.id = "topScript";
	nscript.charset = "utf-8";
	nscript.async = true;
	nscript.text = r;
	document.getElementsByTagName('head')[0].appendChild(nscript);

	img = null;

	sourceLoaded();
};
img.src = "img/oimo_three.png";