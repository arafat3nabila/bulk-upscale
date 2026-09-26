/**
 * Creates genuine transparent PNG test files directly in the browser
 * so the user can test the workflow immediately.
 */
export async function createSamplePngFiles(): Promise<File[]> {
  const createBadge = (text: string, subtext: string, color: string, isRound = true): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(new File([], 'sample.png', { type: 'image/png' }));
        return;
      }

      // Clear transparent
      ctx.clearRect(0, 0, 256, 256);

      // Draw transparent cutout badge
      ctx.save();
      ctx.beginPath();
      if (isRound) {
        ctx.arc(128, 128, 110, 0, Math.PI * 2);
      } else {
        // Rounded rect
        const r = 24;
        ctx.roundRect(16, 16, 224, 224, [r]);
      }
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Inner glow ring
      ctx.beginPath();
      if (isRound) {
        ctx.arc(128, 128, 95, 0, Math.PI * 2);
      } else {
        ctx.roundRect(30, 30, 196, 196, [16]);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Main Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 115);

      // Subtext
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = '600 14px sans-serif';
      ctx.fillText(subtext, 128, 155);

      ctx.restore();

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `${text.toLowerCase().replace(/\s+/g, '_')}_transparent.png`, {
            type: 'image/png'
          });
          resolve(file);
        } else {
          resolve(new File([], 'sample.png', { type: 'image/png' }));
        }
      }, 'image/png');
    });
  };

  const file1 = await createBadge('CRYSTAL', 'Alpha Transparent', '#2563eb', true);
  const file2 = await createBadge('PIXCRAFT', 'HQ Vector Icon', '#4f46e5', false);
  return [file1, file2];
}
