const log_dir = "logs"
const error_file = Bun.file(`${log_dir}/error.log`)
const log_file = Bun.file(`${log_dir}/info.log`)
const log_writer = log_file.writer();
const err_writer = error_file.writer()

declare global {
	interface Console {
		json(name: string, object: object): void;
		error(err: Error, cause: string | undefined): void
	}
}

const { error, log } = console;

console.log = async (...p: any[]) => {
	log(...p)
	log_writer.ref()
	log_writer.write(`${p.join(" ")}\n`);
	log_writer.flush()
	log_writer.unref()
}
console.error = (err: Error, cause?: string) => {
	error(err)
	if (cause) err.cause = cause
	const json = JSON.stringify(err, null, 4)
	err_writer.ref()
	err_writer.write(`${json}\n`);
	err_writer.flush()
	err_writer.unref()
}

console.json = async (name: string, object: object) => {
	const json = JSON.stringify(object, null, 4);
	name = name.replace(" ", "_");
	const json_file = Bun.file(`${log_dir}/${name}.json`)
	await json_file.write(json);
}
