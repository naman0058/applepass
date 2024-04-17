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
    if (request.method === 'POST' && request.url === '/pass') {
        try {
            let requestBody = '';

            request.on('data', (chunk) => {
                requestBody += chunk.toString();
            });

            request.on('end', async () => {
                try {
                    const passData = JSON.parse(requestBody); 

                    const newPass = await PKPass.from({
                        model: './model/Generic.pass',
                        certificates: {
                            wwdr: fs.readFileSync('./certs/wwdr.pem'),
                            signerCert: fs.readFileSync('./certs/signerCert.pem'),
                            signerKey: fs.readFileSync('./certs/signerKey.pem'),
                            signerKeyPassphrase: '1234',
                        },
                    }, {
                        authenticationToken: '21973y18723y12897g31289yge981y2gd89ygasdqsqdwq',
                        webServiceURL: 'http://127.0.0.1:5001/zeta-bonsai-410704/us-central1/pass',
                        serialNumber: 'PASS-213213',
                        description: 'Palace',
                        logoText: 'Palace Cinemas',
                        logoTextColor: hexToRgb('#' + passData.logoTextColor),
                        foregroundColor: hexToRgb('#' + passData.textColor),
                        backgroundColor: hexToRgb('#' + passData.backgroundColor),
                    });

                    // Clear existing fields
                    newPass.primaryFields = [];
                    newPass.secondaryFields = [];
                    newPass.auxiliaryFields = [];

                    // Add primary field
                    newPass.primaryFields.push({
                        key: 'primary',
                        label: passData.primary.label,
                        value: passData.primary.value,
                    });

                    // Add secondary fields
                    passData.secondary.forEach((field, index) => {
                        newPass.secondaryFields.push({
                            key: `secondary${index}`,
                            label: field.label,
                            value: field.value,
                        });
                    });

                    // Add auxiliary fields
                    passData.auxiliary.forEach((field, index) => {
                        newPass.auxiliaryFields.push({
                            key: `auxiliary${index}`,
                            label: field.label,
                            value: field.value,
                        });
                    });

                    const bufferData = newPass.getAsBuffer();

                    fs.writeFileSync('apple12356.pkpass', bufferData);

                    console.log('Pass was generated successfully');
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({}));
                } catch (error) {
                    console.error('Error generating pass:', error);
                    response.writeHead(500, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ error: 'Failed to generate pass' }));
                }
            });
        } catch (error) {
            console.error('Error parsing request body:', error);
            response.writeHead(400, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Invalid request body' }));
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
