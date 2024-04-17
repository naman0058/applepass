const http = require('http');
const { PKPass } = require('passkit-generator');
const fs = require('fs');

function hexToRgb(hex) {
    hex = hex.replace(/^#/, '');
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;
    return `rgb(${r}, ${g}, ${b})`;
}

const server = http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/pass') {
        try {
            const passData = {
                secondary: [
                    { label: 'Member Type', value: 'Palace Movie Club' },
                ],
            };

            const newPass = await PKPass.from({
                model: './model/Generic.pass',
                certificates: {
                    wwdr: fs.readFileSync('./certs/wwdr.pem'),
                    signerCert: fs.readFileSync('./certs/signerCert.pem'),
                    signerKey: fs.readFileSync('./certs/signerKey.pem'),
                    signerKeyPassphrase: '1234',
                },
            }, {
                // keys to be added or overridden
                serialNumber: 'AAGH44625236dddaffbda'
                // authenticationToken: '21973y18723y12897g31289yge981y2gd89ygasdqsqdwq',
                //         webServiceURL: 'http://127.0.0.1:5001/zeta-bonsai-410704/us-central1/pass',
                //         serialNumber: 'AAGH44625236dddaffbdaaaaa',
                //         description: 'Palace',
                //         logoText: 'Palace Cinemas',
                //         logoTextColor: hexToRgb('#FFFFFF'),
                //         foregroundColor: hexToRgb('#FFFFFF'),
                //         backgroundColor: hexToRgb('#000000'),
            });

            // Set additional pass data
            newPass.setBarcodes('36478105430'); // Random value

            // Generate the .pkpass file buffer
            const buffer = newPass.getAsBuffer();

            // Save the buffer to a .pkpass file
            fs.writeFileSync('Done.pkpass', buffer);

            console.log('Pass file saved successfully');
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({}));
        } catch (error) {
            console.error('Error generating pass:', error);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Failed to generate pass' }));
        }
    } else {
        response.writeHead(404, { 'Content-Type': 'text/plain' });
        response.end('Not Found');
    }
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
