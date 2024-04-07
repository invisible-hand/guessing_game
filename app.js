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
      temperature: 0.1,
      topP: 0.1,
      topK: 16,
    };
    const model = genAI.getGenerativeModel({ model: 'gemini-pro', generationConfig });
    let question = '';

    while (true) {
      const prompt = `Each question has a difficulty level from 1 to 10. 1 is the easiest and 10 is the hardest.
        Generate a question of difficulty level ${difficulty}. 
        Question should be on one of the topics, picked each time at random: Geography, Popular culture, Math, Sports or Literature. 
        Do not repeat topics more than two times in a row.
        You should be able to answer the question with one or two words or numbers. 
        Do not provide answer options.
        Make sure questions are diverse and interesting.
        Generate only one question per request.
        Do not state the topic in the question.
        Do not ask question that you have already asked - look in this list ${generatedQuestions}
        Do not ask question about the capital of France. Try to think of something unique!`;
      const generationResult = await model.generateContent(prompt);
      const response = await generationResult.response;
      question = await response.text();
      console.log(generatedQuestions)

      if (!generatedQuestions.includes(question)) {
        generatedQuestions.push(question);
        break;
      }
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
    const prompt = `Question: ${question}\nAnswer: ${answer}\nIs the Answer correct? Respond with "yes" or "no" only.`;
    const generationResult = await model.generateContent(prompt);
    const response = await generationResult.response;
    const text = response.text();
    const isCorrect = text.toLowerCase().includes('yes');
    
    const answerGemini = await model.generateContent(`Answer this question briefly: ${question}`);
    const response2 = await answerGemini.response;
    const text2 = response2.text();

    const validationResult = isCorrect ? `Correct answer!\n\n The question was:\n\n"${question}"\n\n Your answer: ${answer} \nCorrect answer is: ${text2}` : `Wrong answer.\n\n The question was:\n\n"${question}"\n\n Your answer: ${answer}\nAnswer is: ${text2}`;
    res.json({ result: validationResult });
  } catch (error) {
    console.error('Error validating answer:', error);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});