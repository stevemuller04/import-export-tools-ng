const fs = require('fs-extra');
const path = require('path');
const prettier = require("prettier");
var parser = require("dtd-file");

const projectId = 'ThunderbirdTranslations';

const key = fs.readJSONSync("/Dev/SecurityMaterial/gapi-key.json").gapiKey;

// Imports the Google Cloud client library
const { Translate } = require('@google-cloud/translate').v2;

// Instantiates a client
const translate = new Translate({ projectId, key });

// console.debug( translate );

var translationArray1 = [
  { key: "latinizeTransform", text: "Latinize transform"},
  { key: "characterFilter", text: "Character Filter (UTF-8 or UTF-16)"},
  { key: "utf16Filter", text: "Filter UTF-16 characters (Symbols and Emojis)"},
  { key: "nonAlphanumericFilter", text: "Filter non-alphanumeric characters"},
  { key: "multipleFolders.title", text: "Multiple Folders"},
];

var translationArray = [
  { key: "cancel.msg", text: "Cancel"},
];
//{ key: "multiple-folders-warning", text: "Multiple folders are not supported.\n\nClick OK to export just the first folder."},

// const localeDir = "../src/chrome/locale";
const localeDir = "./src/chrome/locale";
// const outputLocaleDir = "./src/_locales";
// const localeDir = "./locale";
// const localeFile = "mboximport/mboximport.dtd";
// const localeFile = "mboximport/mboximport.properties";
var localeFile = "messages-out.json";
const referenceLocaleId = "en";


var _getAllFilesOrFolders = function (dir, foldersOnly) {

	var filesystem = require("fs");
	var files = [];
	var folders = [];

	filesystem.readdirSync(dir).forEach(function (fileObj) {

		file = dir + '/' + fileObj;
		var stat = filesystem.statSync(file);

		if (stat && stat.isDirectory()) {
			// results = results.concat(_getAllFilesFromFolder(file));
			folders.push(fileObj);
		} else files.push(fileObj);
	});

	if (foldersOnly) {
		return folders;
	} else {
		return files;
	}
	return results;

};


async function translateAllLocales(iFile, sourceArray, locales, format, options) {
	var sourceLocale = referenceLocaleId;

	var promises = [];
	var ts = "\n";
	var tarray = [];

	for (let i = 0; i < locales.length; i++) {
		var locale = locales[i].toLowerCase();
		var shortLocale = locale.split('-')[0];

		if (shortLocale === referenceLocaleId && options.skipEN) {
			continue;
		}

		console.debug('Locale ' + locale + ' ' + locales);

		// set up source identifier for locale 
		// var sourceIdentifier = `<label class="notranslate" locale="${locale}">test</label>`;
		var sourceIdentifier = `<data-translation class="notranslate" locale="${locales[i]}">`;

		var sourceStrings = sourceArray.map(s => s.text);
		sourceStrings.unshift(sourceIdentifier);

		promises.push(translate.translate(sourceStrings, shortLocale)
			.then(([translations]) => {
				tarray.push(translations);
				console.debug('translations return');
				console.debug(translations);
			}));
	}

	await Promise.all(promises);

	// console.debug(tarray);

	for (let i = 0; i < tarray.length; i++) {

		let targetLocale = tarray[i][0].match(/locale="(.*)"/)[1];
		let stringArray = tarray[i].slice(1);

		console.debug(targetLocale);
		console.debug(stringArray);
		// continue;

		console.debug('TranslationArray');
		console.debug(translationArray);
		console.debug('GenerateMessages');
		let lt = stringArray.map((s, i) => {
			let entry;

			switch (options.outputFormat) {
				// messages.json
				case 0:
					switch (path.extname(iFile)) {
						case '.dtd':
							console.debug('DTD 0  ' + iFile);
							entry = `<!ENTITY ${sourceArray[i].key} "${s}">`;
							break;
		
						case '.properties':
							console.debug('Properties 0  ' + iFile);
							entry = `${sourceArray[i].key}=${s}`;
							break;
						default:
							break;
					}
					break;
				case 1:
					entry = `${sourceArray[i].key}=${s}`;
					break;
				case 2:
					entry = `<!ENTITY ${sourceArray[i].key} "${s}">`;
					break;
				case 3:
					entry = `\t"${sourceArray[i].key}": {\n\t\t"message": "${s}"\n\t}`;
					if (i < sourceArray.length - 1) {
						entry += ",\n";
					}
					break;
				default:
					break;
			}
			// console.debug(i);
			// console.debug(translationArray[i]);

			// let entry = `\t"${translationArray[i].key}": {\n\t\t"message": "${s}"\n\t},\n`;
			// let entry = `\t"${sourceArray[i].key}": {\n\t\t"message": "${s}"\n\t},\n`;
			// console.debug(entry);
			return entry;

		});

		lt = lt.join('\n');

		if (options.outputFormat === 3 && !options.append) {
			lt = `{\n${lt}\n}`;
		}

		lt = lt.replace(/<nl>/g, "\\n");
		console.debug('TranslationMessages ' + lt.length);
		console.debug(lt);
		// let outputFileName = iFile.replace('.', '-') + ".json";
		let outputFileName = iFile;

		
		if (options.append && options.outputFormat === 3) {
			var source = fs.readFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, { encoding: 'utf8' });
			source = source.substr(0, source.lastIndexOf('}') - 1) + ",\n\n" + lt + "\n}";
			console.debug(source);
			fs.outputFileSync(`${options.outputLocaleDir}/${targetLocale}/${outputFileName}`, source);
		}
		else if (options.append) {
			console.debug('AppendingMessages');
			lt = "\n" + lt;
			fs.appendFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, lt);
			
		} else {
			fs.outputFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, lt);
			
		}
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


// console.debug(translate);

async function translateHelpPage() {
	//var localeFolders = _getAllFilesOrFolders(localeDir, true);
	
	//var supportedLocales = ['ca', 'da', 'de', 'en-US', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM'];

	//var supportedLocales = ['it', 'ja', 'ko-KR', 'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN', 'el'];

	//  const supportedLocales2 = ['pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE' ];
	// supportedLocales = ['es-ES'];
	// supportedLocales = ['el', 'gl-ES', 'hu-HU', 'hy-AM',
	// 'sk-SK', 'sl-SI', 'sv-SE', 'el'];


	//localeFolders = supportedLocales;
	// console.debug(localeFolders);
	var helpLocaleDir = "./src/chrome/content/mboximport/help/locale";
	var helpPage = "./src/chrome/content/mboximport/help/locale/en-US/importexport-help.html";
	var helpBase = "importexport-help";
	var source = fs.readFileSync(helpPage, { encoding: 'utf8' });

	for (let i = 0; i < localeFolders.length; i++) {
		if (localeFolders[i] === 'en-US') {
			continue;
		}
		await sleep(100);
		// var locale = locales[i].toLowerCase();
		var shortLocale = localeFolders[i].split('-')[0];
		if (shortLocale === 'zh') {
			shortLocale = 'zh-CN';
		}
		var outputFileName = `${helpLocaleDir}/${localeFolders[i]}/${helpBase}.html`;

		// if (fs.existsSync(outputFileName)) {
		// 	console.debug('Exists: ' + outputFileName);
		// 	continue;
		// }

		console.debug('Translate ' + shortLocale);

		try {
			translatePage([`<data class="notranslate">${outputFileName}`, source], 'en', shortLocale, translation => {
				console.debug('call back ' + translation[0].split('>')[1]);
				let outputFileName = translation[0].split('>')[1];
				console.debug(outputFileName);
				fs.outputFileSync(outputFileName, translation[1]);
				console.debug('Translated ' + shortLocale);
			});
		} catch (e) {
			console.debug(e);
		}
		// break;
		sleep(2);
	}
}


function translatePage(pageSource, sourceLocale, targetLocale, saveOutputCB) {
	// promises.push(translate.translate(sourceStrings, shortLocale)
	// var helpPage = "./src/chrome/content/mboximport/importexport-help-en-US.html";
	// var helpBase = "./src/chrome/content/mboximport/importexport-help";
	// var helpPage = "./src/chrome/content/mboximport/test1.html";
	// var source = fs.readFileSync(helpPage, {encoding: 'utf8'});
	// console.debug(source);
	// var sourceLocale = "en";
	// var shortLocale = "pt-PT";
	var translatedString = translate.translate(pageSource, { prettyPrint: true, from: sourceLocale, to: targetLocale, format: 'html' })
		.then(([translations]) => {
			try {
				console.debug('T0 ' + translations[0]);
				translations[1] = prettier.format(translations[1], { parser: 'html', printWidth: 110 });
			} catch (error) {
				console.debug(error);
			}
			// fs.outputFileSync(helpBase+"-"+shortLocale+".html",translations);
			// console.debug(translations);
			// tarray.push(translations);
			saveOutputCB(translations);
		});
	// console.debug(translatedString);
}

async function translateAll(iFile, strings, options) {
	let s = new Date();
	console.debug('Start ' + s);

	await translateAllLocales(iFile, strings, localeFolders, 1, options);

	let st = new Date();
	console.debug('Stop ' + st);
	console.debug('Stop ' + (st - s) / 1000);
}

var localeFolders = _getAllFilesOrFolders(localeDir, true);
console.debug(localeFolders);

function t() {
	let tb_locale = 'hu';
	var supportedLocales = ['ca', 'da', 'de', 'en-US', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hu-HG', 'hy-AM',
		'it', 'ja', 'ko-KR', 'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

	var supportedLocaleRegions = supportedLocales.filter(l => {
		if (l === tb_locale || l.split('-')[0] === tb_locale.split('-')[0]) {
			return true;
		}
		return false;
	});

	console.debug(supportedLocaleRegions);
	if (!tb_locale || supportedLocaleRegions.length === 0) {
		tb_locale = "en-US";
	} else if (!supportedLocaleRegions.includes(tb_locale)) {
		tb_locale = supportedLocaleRegions[0];
	}

	console.debug(' locale subset');
	console.debug(supportedLocaleRegions);
	console.debug(tb_locale);

}

function loadMessageStrings(msgFile, options) {
	console.debug(`Loading MessageFile: ${options.inputLocaleDir}/${msgFile}`);
	let srcMessages = fs.readJSONSync(`${options.inputLocaleDir}/${msgFile}`);
	var messageStrings = [];

	for (const key in srcMessages) {
		if (srcMessages.hasOwnProperty(key)) {
			let str = srcMessages[key].message;
			messageStrings.push({ key: key, text: str });
		}
	}
	// console.debug('MessageStrings');
	// console.debug(messageStrings);
	return messageStrings;
}

function loadDTD(dtdFile, options) {
	console.debug(`Loading DTD: ${options.inputLocaleDir}/${dtdFile}`);
	let fileEntitiesKeys = Object.keys(parser.parse(fs.readFileSync(`${options.inputLocaleDir}/${dtdFile}`, 'utf-8')));
	let fileEntities = parser.parse(fs.readFileSync(`${options.inputLocaleDir}/${dtdFile}`, 'utf-8'));
	// console.debug(fileEntities);
	translationArray = [];

	for (const key in fileEntities) {
		if (fileEntities.hasOwnProperty(key)) {
			const message = fileEntities[key];
			translationArray.push({ key: key, text: message });
		}
	}
	// console.debug(translationArray);
	// return fileEntities;
	return translationArray;
}

function loadPropertys(propertyFile, options) {
	console.debug(`Loading propertyFile: ${options.inputLocaleDir}/${propertyFile}`);
	let propertiesText = fs.readFileSync(`${options.inputLocaleDir}/${propertyFile}`, 'utf-8');
	// console.debug(propertiesText);
	const rg = /^(.+)=(.+)$/gm;
	let properties = Array.from(propertiesText.matchAll(rg));
	let propertyStrings = properties.map(p => {
		// return {`"${p[1]}": "${p[2]}"`});
		let key = p[1];
		let str = p[2];
		return { key: key, text: str };
		// return { `"${p[1]}"`: "a"};
	});

	translationArray = propertyStrings;

	// for (const key in propertyStrings) {
	// 	if (propertyStrings.hasOwnProperty(key)) {
	// 		const message = propertyStrings[key];
	// 		translationArray.push({ key: key, text: message });
	// 	}
	// }
	// console.debug(translationArray);
	
	// console.debug(propertyStrings);
	return propertyStrings;
}


function loadTranslationArray(inputFiles, options) {

	inputFiles.forEach(iFile => {
		var strings = [];
		options.lastFile = false;
		console.debug('Processing: ' + iFile);
		if (iFile === inputFiles[inputFiles.length - 1]) {
			options.lastFile = true;
		}
		switch (path.extname(iFile)) {
			case '.dtd':
				strings = loadDTD(iFile, options);
				options.propertiesType = false;
				translateAll(iFile, strings, options);
				break;
			case '.properties':
				strings = loadPropertys(iFile, options);
				options.propertiesType = true;
				translateAll(iFile, strings, options);
				break;
			case '.json':
				translationArray = loadMessageStrings(iFile, options);
				options.propertiesType = false;
				//translateAll(iFile, strings, options);
				console.log(translationArray)
				break;
	
			default:
				break;
		}

	});
}

function convert(iFile, options) {
	localeFolders.forEach(locale => {
		let input = `./src/chrome/locale/${locale}/mboximport/${iFile}`;
		console.log(input)
		let output = `./src/_locale/${locale}/tokens.json`;
		console.log(output)
		options.inputLocaleDir = `./src/chrome/locale/${locale}/mboximport`
		var strings = loadPropertys(iFile, options);
		console.log(strings)

		let outputJson = "";
		strings.forEach((keyText, index) => {
			let key = keyText.key;
			let text = keyText.text;
			//let entry = eval(`{"${key}": {message: "${text}" }`)
			var entry = `\t"${key}": {\n\t\t"message": "${text}"\n\t}`;
			if (index < strings.length - 1) {
				entry+= ",\n\n"
			}
			console.log(entry)
			outputJson += entry;
			
		})
		//outputJson += "\n};";
 	//	outputJson = prettier.format(outputJson	, { parser: 'json', printWidth: 110 });
		let targetLocale = locale;
		let outputFileName = "messages.json";
		console.log(outputJson)
		var source = fs.readFileSync(`${options.outputLocaleDir}/${targetLocale}/${options.outputLocaleDirSuffix}${outputFileName}`, { encoding: 'utf8' });
			source = source.substr(0, source.lastIndexOf('}') - 1) + ",\n\n" + outputJson + "\n}";
			console.debug(source);
			fs.outputFileSync(`${options.outputLocaleDir}/${targetLocale}/${outputFileName}`, source);
		
		//fs.outputFileSync(output, outputJson);

	});
}

var cs = "python locale-converter.py ..\\src\\chrome\\locale\\${l1}\\mboximport ..\\src\\_locales\\${l2}"

function locs() {
	localeFolders.forEach(loc => {
		let s = cs
		s = s.replace("${l1}",loc)
		s = s.replace("${l2}",loc)

		console.log(s)
	});

}

var options3 = {
	inputLocaleDir: `./src/_locales/en-US`,
	outputLocaleDir: "./src/_locales",
	outputLocaleDirSuffix: "",
	append: true,
	outputFormat: 3,
	skipEN: false,
};

// dtd=2
var options0 = {
	inputLocaleDir: `./src/chrome/locale/en-US/mboximport`,
	outputLocaleDir: "./src/chrome/locale",
	outputLocaleDirSuffix: "mboximport/",
	append: true,
	skipEN: false,
	outputFormat: 2,
};

// properties=1
var options2 = {
	inputLocaleDir: `./src/chrome/locale/en-US/mboximport`,
	outputLocaleDir: "./src/chrome/locale",
	outputLocaleDirSuffix: "mboximport/",
	append: false,
	skipEN: true,
	outputFormat: 1,
};

	//inputLocaleDir: `./src/chrome/locale/en-US/mboximport`,

var options = {
	inputLocaleDir: `./src/_locales/en-US`,

	outputLocaleDir: "./src/_locales",
	outputLocaleDirSuffix: "",
	skipEN: false,
	append: true,
	outputFormat: 3,
};

let inputFiles;
// let inputFiles = ["settings.dtd", "settings.properties", "overlay.dtd", "overlay.properties"];
// let inputFiles = ["settings.dtd", "settings.properties"];
// let inputFiles = ["settings.dtd"];
// let inputFiles = ["overlay.properties"];
// let inputFiles = ["settings.dtd", "overlay.dtd", "overlay.properties"];


inputFiles = ["messages.json"];
//inputFiles = ["mboximport.dtd"];
// let inputFiles = ["autobackup.dtd", "autobackup.properties", "mboximport.dtd", "mboximport.properties", "profilewizard.dtd", "profilewizard.properties"];
//inputFiles = ["mboximport.properties"];
// var supportedLocales = ['de', 'en-US', 'nl', 'fr', 'it', 'zh-CN', 'ja', 'es-ES', 'ru', 'hu-HU', 'hy-AM', 'ko-KR',
// 						'el', 'pl', 'da', 'pt-PT'];

localeFolders = ['de', 'en-US', 'nl', 'fr', 'it', 'zh-CN', 'ja', 'es-ES', 'ru', 'hu-HU', 'hy-AM', 'ko-KR',
'el', 'pl', 'da', 'pt-PT', 'ca', 'gl-ES', 'sk-SK', 'sl-SI', 'sv-SE'];

// full locale set
localeFolders = ['en-US', 'de', 'ca', 'cs', 'da', 'el', 'es-ES', 'fr', 'gl-ES', 'hu-HU', 'hy-AM', 'it', 'ja', 'ko-KR',
	'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];

// unmanaged help locales
localeFolders = ['en-US', 'ca', 'cs', 'el', 'es-ES', 'gl-ES', 'hu-HU', 'hy-AM', 'it', 'ko-KR',
	'nl', 'pl', 'pt-PT', 'ru', 'sk-SK', 'sl-SI', 'sv-SE', 'zh-CN'];


// managed help locales
//localeFolders = ['de', 'ja', 'fr', 'da'];


translateHelpPage();
//translatePage();
//loadTranslationArray(inputFiles, options);
//console.log(translationArray.length)
//translationArray = translationArray.slice(101)
//translateAll("messages.json", translationArray, options);
//translateAll(inputFiles, translationArray, options);
 //loadTranslationArray(inputFiles, options);
 //convert(inputFiles, options);
//locs()
// let inputFiles = ["settings.dtd"];
/*
node .\scripts\translate-gc.js
*/