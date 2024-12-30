/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

/**
 * Compresses a string using the specified compression format, which is "gzip" by default.
 * @param input The string to compress
 * @param format The compression format to use (default: gzip)
 * @returns The compressed data as Uint8Array
 */
async function compressString(input: string, format: CompressionFormat = "gzip"): Promise<Uint8Array> {
	const inputBytes = new TextEncoder().encode(input);

	const stream = new CompressionStream(format);
	const writer = stream.writable.getWriter();

	// Put input bytes through the compression stream via writer
	writer.write(inputBytes);
	writer.close();

	// Response allows convertion of readable stream to an ArrayBuffer
	const compressedDataBuffer = await new Response(stream.readable).arrayBuffer();
	return new Uint8Array(compressedDataBuffer);
}

/**
 * Compresses and base64-encodes a string using the specified compression format.
 * @param input The string to compress and encode
 * @param format The compression format to use (default: gzip)
 * @returns The compressed and encoded data as a base64 string
 */
export async function compressAndEncode(input: string, format: CompressionFormat = "gzip"): Promise<string> {
	console.debug("Compressing and encoding data...");
	const compressedData = await compressString(input, format);
	return btoa(String.fromCharCode(...compressedData));
}

// ---------------------------------------------------------------------------------------------------------------------
/**
 * Decodes and decompresses a base64-encoded string.
 * @param input The compressed and base64-encoded data
 * @param format The compression format to use (default: gzip)
 * @returns The decompressed data as a string
 */
export async function decodeAndDecompress(input: string, format: CompressionFormat = "gzip"): Promise<string> {
	console.debug("Decoding and decompressing data...");
	const compressedData = atob(input);
	const compressedByteArray = new Uint8Array(compressedData.length);
	for (let i = 0; i < compressedData.length; i++) {
		compressedByteArray[i] = compressedData.charCodeAt(i);
	}
	return await decompressString(compressedByteArray, format);
}

/**
 * Decompresses a Uint8Array using the specified compression format.
 * @param input The compressed data
 * @param format The compression format to use (default: gzip)
 * @returns The decompressed data as a string
 */
async function decompressString(input: Uint8Array, format: CompressionFormat = "gzip"): Promise<string> {
	const stream = new DecompressionStream(format);
	const writer = stream.writable.getWriter();
	writer.write(input);
	writer.close();

	const decompressedDataBuffer = await new Response(stream.readable).arrayBuffer();
	return new TextDecoder().decode(decompressedDataBuffer);
}
