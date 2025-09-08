module.exports = {
    reactStrictMode: true,
    async headers () {
        return [
            {
            // matching all API routes
                source: '/api/:path*',
                headers: [
                    { key: 'Access-Control-Allow-Origin', value: '*' } // requried for allowing display of ERC721 NFT metadata and image
                ]
            }
        ]
    }
}
