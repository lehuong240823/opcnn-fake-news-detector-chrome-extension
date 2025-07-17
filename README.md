# opcnn-fake-news-detector-chrome-extension
Eye of Ra: A Chrome Extension for Fake News Detection using OPCNN-FAKE

## About dataset
The dataset use to train the model is ISOT Fake News Dataset which collected from Kaggle. You can find out more about the dataset at here: https://www.kaggle.com/datasets/emineyetm/fake-news-detection-datasets.

## Knowlegde context
The dataset mainly focused on articles and electronic news. Furthermore, NLP  relies heavily on vocabulary and structure, performance may degrade when applied to out-of-context sources like social media, which highlights potential challenges in real-world deployment.

## About CNN architecture
The model based on Optimized Convolutional
Neural Network for Fake News Detection (OPCNN-FAKE) which has been published in IEEE Access, Volume: 9. It provided fascinating aspect about apply new method to extract hierachy feature which shown in conv and pooling combination.
If you feel interested about this architecture, you can read full article at here https://ieeexplore.ieee.org/document/9537782

## Repository structure
This repository contains 3 folders: demo, models and notebooks. Demo contains source code and distribution version of extension which you can use in installation or development. Models contains the final tfjs model is used in deployment phase. Notebooks contain Jupiter Notebook implements the completed procedure to build the model. The procedure was mainly based on the procedure mentioned in the official article about OPCNN-FAKE and has some improvisation.

## Installation

## Usage
1. Access