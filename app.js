require('dotenv').config();

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

app.use(express.static('public'));
app.use(express.json());

const port = process.env.PORT || 3000;

const generatedQuestions = [];

app.get('/api/question', async (req, res) => {
  try {
    const difficulty = parseInt(req.query.difficulty) || 1;
    const generationConfig = {
      maxOutputTokens: 300,
      temperature: 0.9,
      topP: 0.3,
      topK: 32,
    };
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro-latest', generationConfig });
    let question = '';

    const prompt = `Each question has a difficulty level from 1 to 10. 1 is the easiest and 10 is the hardest.
      Generate a question of difficulty level ${difficulty}. 
      You should be able to answer the question with one or two words or numbers. 
      Do not provide answer options.
      Ask question on one of the following topics, randomly: Math, Geogrpahy, Cars,. Music, Popular culture.
      Do not state the topic in the question.
      Do not ask a question that you have already asked from this list: ${generatedQuestions}
      Do not ask a question about capital of france, largest ocean or largest country in the world.
      Do not ask math questions`;
    const generationResult = await model.generateContent(prompt);
    const response = await generationResult.response;
    question = await response.text();
    console.log(generatedQuestions)

    if (!generatedQuestions.includes(question)) {
      generatedQuestions.push(question);
      console.log('Generated question:', question);
    }

    res.json({ question });
  } catch (error) {
    console.error('Error generating question:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

app.post('/api/answer', async (req, res) => {
  try {
    const { question, answer } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Get the correct answer from the model
    console.log('Question received:', question);
    const correctAnswerPrompt = `Question: ${question}\nAnswer the question briefly.`;
    const correctAnswerResult = await model.generateContent(correctAnswerPrompt);
    const correctAnswerResponse = await correctAnswerResult.response;
    const correctAnswer = (await correctAnswerResponse.text()).trim();
    console.log('Correct answer:', correctAnswer);

    // Check if the user's answer is correct
    const isAnswerCorrectPrompt = `Question: ${question}\nAnswer: ${answer}\nIs this answer correct? Respond with "Yes" or "No".`;
    const isAnswerCorrectResult = await model.generateContent(isAnswerCorrectPrompt);
    const isAnswerCorrectResponse = await isAnswerCorrectResult.response;
    const isAnswerCorrect = (await isAnswerCorrectResponse.text()).trim().toLowerCase();
    console.log('User\'s answer:', answer);
    console.log('Is answer correct:', isAnswerCorrect);

    const isCorrect = isAnswerCorrect.includes('yes');

    const validationResult = `The question was:\n"${question}"\n\nCorrect answer:\n${correctAnswer}\n\nYour answer:\n${answer}\n\n${isCorrect ? 'Your answer is correct! ✅' : 'Your answer is incorrect. ❌'}`;

    res.json({ result: validationResult, isCorrect });
  } catch (error) {
    console.error('Error validating answer:', error);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});