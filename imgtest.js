// Left(C) Abhishek Hingnikar 2013

var WID = 256;
var HIE = 256;

function ImageProcessor(output) {
    var node = document.createElement('canvas'),
        bufferCtx = node.getContext('2d'),
        
        bufferImageData = null,
        // due to javascript's speed issues i am constrained.
        map = new PixelMapInterface(ImageProcessor.color_modes.RGBA, WID, HIE);

    // handy publics
    this.width = node.width = WID;
    this.height = node.height = HIE;

    this.emptyMap = function () {
        var newMap = map.clone();
        newMap.clear();
        return newMap;
    }

    this.update = function () {
        bufferImageData = bufferCtx.getImageData(0, 0, WID, HIE);
        map.loadFromCanvasPixelArray(bufferImageData);
    }
    this.render = function () {
        map.dumpToCanvasPixelArray(bufferImageData);
        bufferCtx.putImageData(bufferImageData, 0, 0);
    }
    this.getMap = function () {
        return map.clone();
    }

    this.setMap = function (newMap) {
        if (newMap.mode !== undefined) 
            map = newMap;
    }

    this.pasteImage = function (img) {
        bufferCtx.drawImage(img, 0, 0, this.width, this.height);
        this.update();
    }
    this.compositePaintImage = function(img,gco){
        bufferCtx.globalCompositeOperation = gco;
        this.pasteImage(img);
        bufferCtx.globalCompositeOperation = 'none';
    }
    !output && document.getElementById('cont').appendChild(node);
}


ImageProcessor.prototype.loadImage = function (img) {
    if (img.complete !== true) {
        img.addEventListener('load', this.loadImage);
        return;
    }
    this.pasteImage(img);
}

ImageProcessor.color_modes = {
    BOOLEAN:-1,
    RGBA: 0,
    RGB: 1,
    GREYSCALE: 2,
    HSVA: 3,
    HSV: 4
};

ImageProcessor.noops = {
    BOOLEAN:{
        R:0,
        G:0,
        B:0,
        A:0
    },
    RGBA: {
        R: 0,
        G: 0,
        B: 0,
        A: 0
    },
    RGB: {
        R: 0,
        G: 0,
        B: 0,
        A: 255
    },
    GRAYSCALE: {
        R: 0,
        G: 0,
        B: 0,
        A: 255,
    },
    HSLA: {
        R: 0,
        G: 0,
        B: 0,
        A: 0
    },
    HSL: {
        H: 0,
        S: 0,
        L: 0,
        A: 255
    }
};
ImageProcessor.utils = {};
ImageProcessor.filters = {
    'noop': [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
    ],

        'edge': [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1]
    ],

        'blur': [
        [0.0, 0.2, 0.0],
        [0.2, 0.2, 0.2],
        [0.0, 0.2, 0.0]
    ],
        'laplace': [
        [0.5, 1, 0.5],
        [1, -6, 1],
        [0.5, 1, 0.5]
    ]
}



/* Filter Sequence .js */
function FilterSequence(filterDataArray) {
    this.filterArray = [];
    this.filterArrayLen = filterDataArray.length
    // Generate them filters
    for (var i = 0; i < this.filterArrayLen; i++) {
        this.filterArray.push(filterDataArray[i]);
    }
}

ImageProcessor.filterSequence = FilterSequence;


FilterSequence.prototype.ApplyFilters = function (ip) {
    this.map = ip.getMap();
    this.outMap = ip.emptyMap();

    for (var i = 0; i < this.filterArrayLen; i++) {
        this.filterArray[i]();
        this.map = this.outMap;
    }
    ip.setMap(this.outputMap);
}

/* End for now */

function PixelMapInterface(mode, width, height) {
    this.mode = mode;
    this.width = width;
    this.height = height;
    this.templateMap = [];

    for (var y = 0; y < this.height; y++) {
        this.templateMap[y] = [];
        for (var x = 0; x < this.width; x++) {
            this.templateMap[y][x] = {
                R: 0,
                G: 0,
                B: 0,
                A: 0
            };
        }
    }
    this.clear = function () {
        this.data = this.templateMap.map(function (e) {
            return e.slice(0)
        });
    }

    this.clone = function () {
        return $.extend({}, this);
    }
    this.setMap = function (data) {
        this.data = data;
    }
    this.clear();
}

PixelMapInterface.prototype.loadFromCanvasPixelArray = function (ImageData) {
    var PixelArray = ImageData.data;
    var x = 0,
        y = 0,
        pixel_iter = 0,
        pixel = null;

    for (y = 0; y < this.width; y++) {
        for (x = 0; x < this.height; x++) {
            pixel = this.data[y][x];
            pixel.R = PixelArray[pixel_iter];
            pixel.G = PixelArray[pixel_iter + 1];
            pixel.B = PixelArray[pixel_iter + 2];
            pixel.A = PixelArray[pixel_iter + 3];
            pixel_iter += 4;
        }
    }

}

PixelMapInterface.prototype.dumpToCanvasPixelArray = function (ImageData) {
    var PixelArray = ImageData.data;
    var x = 0,
        y = 0,
        pixel_iter = 0,
        pixel = null;

    for (y = 0; y < this.width; y++) {
        for (x = 0; x < this.height; x++) {
            pixel = this.data[y][x];
            PixelArray[pixel_iter] = pixel.R;
            PixelArray[pixel_iter + 1] = pixel.G;
            PixelArray[pixel_iter + 2] = pixel.B;
            PixelArray[pixel_iter + 3] = pixel.A;
            pixel_iter += 4;
        }
    }

}



ImageProcessor.prototype.ApplyFilter = function (FilterFn) {
    var container = {
        map: this.getMap(),
        outMap: this.emptyMap()
    };

    FilterFn.call(container, this.width, this.height);
    this.setMap(container.outMap);
}


ImageProcessor.ThresHold = function (max, min) {
    if (this.mode === undefined) {
        console.log("Invalid call");
    }
    
    function constrain(pixel) {
        for (var key in ImageProcessor.noops.RGBA) {
            if (max && (key in max) && pixel[key] > max[key]) {
                return false;
            }
            if (min && (key in min) && pixel[key] < min[key]) {
                return false;
            }
        }

        return true;
    }
    this.mode = ImageProcessor.color_modes.BOOLEAN;
    var w = this.width,
        ht = this.height,
        x = 0,
        y = 0,
        h, s, v, rminusg, rminusb, sum,
        pixel = null;
    for (y; y < ht; y++) {
        for (x = 0; x < w; x++) {
            pixel = this.data[y][x];
            if (!constrain(pixel)) {
                pixel.R = pixel.G = pixel.B = pixel.A = 0;
            }else{
                pixel.R = pixel.G = pixel.B = pixel.A = 255;
            }
        }
    }
}

ImageProcessor.Dilute = function(k){
    if( this.mode === undefined || this.mode !== ImageProcessor.color_modes.BOOLEAN ){
        console.log("Invalid Call");
        return;
    }
    
    var _temp = this.data.map(function(e){
        return e.slice(0);
    });
    
    var w = this.width,
        h = this.height,
        manhattan = ImageProcessor.utils.ManhattanOracle(_temp,w,h,255),
        x = 0,
        y = 0,
        image = this.data,
        pixel;
    for( y; y < h; y++ ){
        for( x = 0; x < w; x++){
            pixel = image[y][x];
            pixel.R = pixel.G = pixel.B = pixel.A = ((manhattan[y][x] <= k)?255:0);
        }
    }
    
}

ImageProcessor.Erode = function(k){
    if( this.mode === undefined || this.mode !== ImageProcessor.color_modes.BOOLEAN ){
        console.log("Invalid Call");
        return;
    }
    
    var _temp = this.data.map(function(e){
        return e.slice(0);
    });
    
    var w = this.width,
        h = this.height,
        manhattan = ImageProcessor.utils.ManhattanOracle(_temp,w,h,0),
        x = 0,
        y = 0,
        image = this.data,
        pixel;
    for( y; y < h; y++ ){
        for( x = 0; x < w; x++){
            pixel = image[y][x];
            pixel.R = pixel.G = pixel.B = pixel.A = ((manhattan[y][x] <= k)?0:255);
        }
    }
    
}

ImageProcessor.utils.ManhattanOracle = function(dataMap,w,h,quan){
    var x,y,pixel,max = w+h,comp = 0;
    for ( y=0; y<h; y++){
        for ( x=0; x<w; x++){
            comp++;
            pixel = dataMap[y][x];
            if (pixel.R == quan){
                pixel = 0;
            } else {
                pixel = max;
                if (y>0) pixel = Math.min(pixel, dataMap[y-1][x]+1);
                if (x>0) pixel = Math.min(pixel, dataMap[y][x-1]+1);
            }
            dataMap[y][x] = pixel;
        }
    }

    var w_minus_1 = w-1;

    for (y = h-1; y>=0; y--){
        for ( x = w_minus_1; x>=0; x--){
            pixel = dataMap[y][x];
            if ( y+1 < h) pixel = Math.min(pixel, dataMap[y+1][x]+1);
            if ( x+1 < w) pixel = Math.min(pixel, dataMap[y][x+1]+1);
            dataMap[y][x] = pixel;
        }
    }
    return dataMap;   
}

ImageProcessor.toHSV = function () {

    if (this.mode === undefined) {
        console.log("Invalid call");
        return;
    }
    if (this.mode === ImageProcessor.color_modes.HSV) {
        return;
    }
    var w = this.width,
        ht = this.height,
        x = 0,
        y = 0,
        h, s, v,max,min,delta,r,g,b,
        pixel = null;

    this.mode = ImageProcessor.color_modes.HSL;

    for (y; y < ht; y++) {
        for (x = 0; x < w; x++) {
            pixel = this.data[y][x];
            r = pixel.R / 255;
            g = pixel.G / 255;
            b = pixel.B / 255;
            max = Math.max(r,g,b);
            min = Math.min(r,g,b);
            delta = max-min;
            v = max;
            if( max !== 0 && delta !== 0){
                s = delta/max;

                if( r === max)
                    h = ((g-b)/delta) % 6;
                else if( g === max )
                h = 2 + (( b - r ) / delta);
              else
                h = 4 + (( r - g ) / delta);
              
                h *= 60;
              if( h < 0 )
                h += 360;
            }else{
                h = 0;
                s = 0;
            }
            
            pixel.R = h;
            pixel.G = s;
            pixel.B = v;
        }
    }
}

ImageProcessor.createConvolutionFilter = function Filter(settings) {
    settings.factor = settings.factor || 1;
    settings.bias = settings.bias || 0;
    settings.filter = settings.filter || 'noop';

    return (function (w, h) {
        var y = 0,
            x = 0,
            //a refernce to filter array
            mat = ImageProcessor.filters[settings.filter],
            filter_height = mat.length,
            filter_width = mat[0].length,
            filter_height_by_2 = (~~ (filter_height / 2)),
            filter_width_by_2 = (~~ (filter_width / 2)),
            bias = settings.bias,
            factor = settings.factor,
            filterX, filterY, centerX, centerY,
            final_r, final_g, final_b, imgX, imgY, temp_pnt;
        // process the image for all pixels
        for (y = 0; y < h; y++) {
            for (x = 0; x < w; x++) {
                // Now for the filter find center x - y
                centerX = x - filter_width_by_2;
                centerY = y - filter_height_by_2;

                final_r = final_g = final_b = 0;

                for (filterY = 0; filterY < filter_height; filterY++) {
                    for (filterX = 0; filterX < filter_width; filterX++) {
                        imgX = centerX + filterX;
                        imgY = centerY + filterY;

                        temp_pnt = ((this.map.data[imgY] !== undefined && this.map.data[imgY][imgX] !== undefined) ? this.map.data[imgY][imgX] : ImageProcessor.noops.RGBA);
                        final_r += temp_pnt.R * mat[filterY][filterX];
                        final_g += temp_pnt.G * mat[filterY][filterX];
                        final_b += temp_pnt.B * mat[filterY][filterX];
                    }
                }
                this.outMap.data[y][x] = {
                    R: ~~Math.min(Math.max(final_r * factor + bias, 0), 255),
                    G: ~~Math.min(Math.max(final_g * factor + bias, 0), 255),
                    B: ~~Math.min(Math.max(final_b * factor + bias, 0), 255),
                    A: 255
                }
            }
        }
    });
}


var blur = ImageProcessor.createConvolutionFilter({
    filter: 'blur',
    factor: 1.0,
    bias: 0.0
});

var laplace = ImageProcessor.createConvolutionFilter({
    filter: 'laplace',
    factor: 1.0,
    bias: 0.0
});
var cont = document.getElementById("cont");
var albert = document.createElement("img");
albert.crossOrigin = true;
albert.width = albert.height = 256;

albert.src = "https://fbcdn-profile-a.akamaihd.net/hprofile-ak-prn2/c30.338.494.494/s160x160/8905_600681993297886_1780623120_n.jpg";
cont.appendChild(albert);



albert.onload = function () {
    var ip2 = new ImageProcessor();
    // First Case Blur before laplace for really less edges
    var start,mm,end;

    start = Date.now();
    for(var i = 0; i < 1; i++ ){
        ip2.loadImage(albert);
        mm = ip2.getMap();
        ImageProcessor.toHSV.call(mm);
        mm.mode = ImageProcessor.color_modes.RGBA;
        
    
        ImageProcessor.ThresHold.call(mm,{
            R:38,
            G:0.68
        },{
            R:6,
            G:0.23
        });
        ImageProcessor.Erode.call(mm,2);        
        ImageProcessor.Dilute.call(mm,3);
        ip2.setMap(mm);
    
        ip2.render();
        ip2.compositePaintImage(albert,'source-in');
    }
    end = Date.now();
    console.log(end - start);
        
}

albert.complete && albert.onload();
