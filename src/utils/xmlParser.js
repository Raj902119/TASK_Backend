const xml2js = require('xml2js');

const parseXMLToJSON = async (xmlData) => {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
    });
    
    const result = await parser.parseStringPromise(xmlData);
    return result;
  } catch (error) {
    throw new Error(`XML parsing error: ${error.message}`);
  }
};

module.exports = { parseXMLToJSON }; 