document.addEventListener('DOMContentLoaded', () => {
  const highlightedTextDiv = document.getElementById('highlightedText');
  const resultDiv = document.getElementById('result');
  const popup = document.getElementById('popup');
  const toggleSettings = document.getElementById('toggleSettings');
  const toggleBack = document.getElementById('toggleBack');
  const vocabSlider = document.getElementById('vocabSlider');
  const vocabInput = document.getElementById('vocabInput');

  const updateUIFromStorage = () => {
    highlightedTextDiv.innerHTML = '<div class="loading-spinner"></div><p class="mt-2 text-sm text-gray-700 text-center">Loading text...</p>';
    resultDiv.innerHTML = '<div class="loading-spinner"></div><p class="mt-2 text-sm text-gray-700 text-center">Analyzing...</p>';

    chrome.storage.local.get(['lastHighlightedText', 'lastAnalysisResult'], (data) => {
      const text = data.lastHighlightedText || 'No text highlighted.';
      const result = data.lastAnalysisResult || 'No analysis result yet.';

      highlightedTextDiv.textContent = text;
      if (result == 'Analyzing...') {
        resultDiv.innerHTML = '<div class="loading-spinner"></div><p class="mt-2 text-sm text-gray-700 text-center">Analyzing...</p>';
      }
      resultDiv.textContent = result;
    });
  };

  updateUIFromStorage();

  chrome.storage.local.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.lastHighlightedText || changes.lastAnalysisResult)) {
      updateUIFromStorage();
    }
  });

  chrome.storage.local.get(['minVocabLength'], (data) => {
    const minVocabLength = data.minVocabLength;
    vocabSlider.value = minVocabLength;
    vocabInput.value = minVocabLength;
  });


  toggleSettings.onclick = () => {
    popup.classList.toggle('settings-open');
  };

  toggleBack.onclick = () => {
    popup.classList.toggle('settings-open');
  };

  vocabSlider.oninput = () => {
    vocabInput.value = vocabSlider.value;
  };
  vocabInput.oninput = () => {
    vocabSlider.value = vocabInput.value;
  };

  document.getElementById('applyBtn').onclick = () => {
    const value = parseInt(vocabInput.value);
    //localStorage.setItem('minVocabLength', value);
    chrome.storage.local.set({minVocabLength: value});

    alert('Settings applied!');
  };
});