
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-cpu';
import lemmatize from 'lemmatizer';
import { removeStopwords } from 'stopword';
import { WordTokenizer } from 'natural';

let model;
let vocab = {};
const tokenizer = new WordTokenizer();

const max_len = 100;
const min_words = 70;
const threshold = 0.7;
const vocab_path = '/assets/vocabulary.json';
const model_path = '/model/tfjs_hyperopt_model/model.json';

async function initModel() {
    //await tf.setBackend('cpu');
    await tf.ready();
    console.log('TF.js backend set to:', tf.getBackend());
    await loadModel();
    await loadVocabulary();
}

initModel();

async function loadModel() {
    if (!model) {
        try {
            model = await tf.loadLayersModel(model_path);
            console.log('TensorFlow.js model loaded successfully in service worker.');
        } catch (error) {
            console.error('Failed to load TensorFlow.js model:', error);
        }
    }
}

async function loadVocabulary(path = vocab_path) {
    try {
        const response = await fetch(path);
        vocab = await response.json();
        console.log('Vocabulary loaded.');
        return vocab;
    } catch (error) {
        console.error('Failed to load Vocabulary:', error);
        return null;
    }
}


chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "analyzeHighlightedText",
        title: "Analyze for Fake News",
        contexts: ["selection"]
    });
    console.log('Context menu item "Analyze for Fake News" created.');
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "analyzeHighlightedText") {
        const highlightedText = info.selectionText;

        if (!model) {
            console.warn("Model not yet loaded. Attempting to load...");
            await loadModel();
            if (!model) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    function: () => alert('Fake News Detector: Model is not ready yet. Please try again.'),
                });
                return;
            }
        }

        storeAndOpenPopup(highlightedText, "Analyzing...")

        try {
            const preprocessedText = preprocessText(highlightedText);
            const sequence = textsToSequences(preprocessedText);

            chrome.storage.local.get(['minVocabLength'], (data) => {
                const minVocabLength = data.minVocabLength || min_words;
                if (!sequence || sequence.length < minVocabLength) {
                    storeAndOpenPopup(highlightedText, "Not enough information for analysis.");
                    console.log("Not enough information for analysis.", sequence.length);
                    return;
                }
            });

            const padded = padSequence(sequence);

            const predictionData = tf.tidy(() => {
                const inputTensor = tf.tensor2d([padded], [1, max_len], 'int32');
                const predictionTensor = model.predict(inputTensor);
                return predictionTensor.dataSync();
            });

            storeAndOpenPopup(highlightedText, interpretPrediction(predictionData[0]));
            console.log("Prediction result:", predictionData[0]);

        } catch (preprocessingError) {
            console.error("Text preprocessing failed:", preprocessingError);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: (errorMsg) => alert(`Fake News Detector: Error during text preprocessing: ${errorMsg}`),
                args: [preprocessingError.message]
            });
            return;
        }
    }
    else {
        console.log('No text highlighted.');
        chrome.storage.local.set({
            lastHighlightedText: 'No text highlighted.',
            lastAnalysisResult: 'No analysis performed.'
        });
        chrome.action.openPopup();
    }

});

function cleanText(text) {
    console.log("[RAW]", text.slice(0, 60));
    // 1. Lowercase
    text = String(text).toLowerCase();
    // 2. Remove URLs (e.g., percentfedup.com/served-...)
    text = text.replace(/https?:\/\/\S+|www\.\S+|\S+\.\S+\/\S*/g, '');
    // 3. Remove mentions and hashtags
    text = text.replace(/@\w+/g, '');
    text = text.replace(/#\w+/g, '');
    // 4. Remove masked/obfuscated words like f*ck
    text = text.replace(/\b\w*\*+\w*\b/g, '');
    // 5. Remove alphanumeric like 700k, 20years, 4th, etc.
    text = text.replace(/\b\d+[a-zA-Z]*\b/g, '');
    text = text.replace(/(\d+)([a-zA-Z]+)/g, '$1 $2');
    // 6. Remove non-letter characters (preserve spaces)
    text = text.replace(/[^a-z\s]/g, ' ');
    // 7. Remove extra whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // 8. Remove short tokens (< 3 chars, keep max 10)
    text = text
        .split(' ')
        .filter(word => word.length >= 3 && word.length <= 10)
        .join(' ');

    console.log("[CLEANED]", text.slice(0, 60));
    return text;
}

function preprocessText(text) {
    text = cleanText(text);
    if (!text) return '';
    let tokens = tokenizer.tokenize(text);
    tokens = tokens.filter(word => word in vocab);
    let filteredTokens = removeStopwords(tokens);
    let stemmedTokens = filteredTokens.map(word => lemmatize(word));
    return stemmedTokens.join(' ');
}

function textsToSequences(text, oovToken = "<OOV>") {
    const tokens = text.toLowerCase().split(/\s+/);
    const oovIndex = vocab[oovToken] || 1;

    return tokens.map(word => vocab[word] || oovIndex);
}

function padSequence(seq, maxLen = max_len, paddingValue = 0) {
    const padded = seq.slice();

    if (padded.length > maxLen) {
        return padded.slice(0, maxLen);
    }

    while (padded.length < maxLen) {
        padded.push(paddingValue);
    }

    return padded;
}

function interpretPrediction(score, threshold = 0.5) {
    if (score >= 0.9) return `Very likely TRUE (${(score * 100).toFixed(1)}%)`;
    if (score >= 0.75) return `Likely TRUE (${(score * 100).toFixed(1)}%)`;
    if (score >= threshold) return `Possibly TRUE (${(score * 100).toFixed(1)}%)`;
    if (score >= 0.3) return `Likely FAKE (${(100 - score * 100).toFixed(1)}%)`;
    return `Very likely FAKE (${(100 - score * 100).toFixed(1)}%)`;
}

function storeAndOpenPopup(highlightedText, analysisResult) {
    chrome.storage.local.set({
        lastHighlightedText: highlightedText,
        lastAnalysisResult: analysisResult
    }, () => {
        chrome.action.openPopup();
    });

    console.log("Analyzing text:", highlightedText);
}
