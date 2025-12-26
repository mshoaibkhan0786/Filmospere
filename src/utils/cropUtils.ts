export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        // crossOrigin required for canvas manipulation
        image.setAttribute('crossOrigin', 'anonymous');

        // If it's a data URL, load it directly (no proxy needed)
        if (url.startsWith('data:')) {
            image.src = url;
        } else {
            // Use wsrv.nl as a reliable CORS proxy that handles images well
            const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(url)}&output=jpg`;
            image.src = proxyUrl;
        }

        // Timeout to prevent hanging
        setTimeout(() => {
            reject(new Error('Image load timed out'));
        }, 15000); // Increased timeout for proxy
    });

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180;
}
export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation);

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
}

/**
 * Validates and limits dimensions to avoid massive canvasses
 */
function getLimitedDimensions(width: number, height: number, maxWidth = 1280) {
    if (width <= maxWidth) return { width, height };
    const ratio = height / width;
    return {
        width: maxWidth,
        height: Math.round(maxWidth * ratio)
    };
}

/**
 * Optimized cropping function
 */
export default async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    rotation = 0,
    flip = { horizontal: false, vertical: false }
): Promise<string> {
    const image = await createImage(imageSrc);

    // Final dimensions we want
    const { width: finalWidth, height: finalHeight } = getLimitedDimensions(pixelCrop.width, pixelCrop.height);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Optimization for common case: No rotation/flip
    if (rotation === 0 && !flip.horizontal && !flip.vertical) {
        canvas.width = finalWidth;
        canvas.height = finalHeight;

        // Draw directly from source coordinates to destination (resized)
        ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            finalWidth,
            finalHeight
        );

        return canvas.toDataURL('image/jpeg', 0.8);
    }

    // Complex case: Rotation or Flip present
    const rotRad = getRadianAngle(rotation);

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    );

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth;
    canvas.height = bBoxHeight;

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
    ctx.rotate(rotRad);
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    ctx.translate(-image.width / 2, -image.height / 2);

    // draw rotated image
    ctx.drawImage(image, 0, 0);

    // extract the cropped image using these values
    const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
    );

    // Resize logic for rotated image
    // Clear and Resize canvas to final result
    canvas.width = finalWidth;
    canvas.height = finalHeight;
    // Reset transform - though setting width/height usually resets context, better be safe if reusing, 
    // but here we are essentially resetting by resizing

    // We need a temp canvas for the extracted data from the rotated big canvas
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = pixelCrop.width;
    tempCanvas.height = pixelCrop.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) throw new Error('No temp context');
    tempCtx.putImageData(data, 0, 0);

    // Draw temp canvas to final canvas with scaling
    ctx.drawImage(tempCanvas, 0, 0, pixelCrop.width, pixelCrop.height, 0, 0, finalWidth, finalHeight);

    // As Base64 string with reduced quality
    return canvas.toDataURL('image/jpeg', 0.8);
}
