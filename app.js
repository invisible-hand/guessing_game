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
      temperature: 0.5,
      topP: 0.1,
      topK: 16,
    };
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro-latest', generationConfig });
    let question = '';

      const prompt = `Each question has a difficulty level from 1 to 10. 1 is the easiest and 10 is the hardest.
        Generate a question of difficulty level ${difficulty}. 
        You should be able to answer the question with one or two words or numbers. 
        Do not provide answer options.
        Do not state the topic in the question.
        Do not ask a question that you have already asked from this list: ${generatedQuestions}
        10 examples of the questions for your guidance:
        1. What is the capital city of Japan?
        2. Who wrote Hamlet?
        4. Who sang "Thriller"?
        5. In what year did the first man walk on the moon?
        6. What is the value of x if 5x - 15 = 10?
        7. Which country won the FIFA World Cup in 2014?
        8. Who is the author of One Hundred Years of Solitude?
        9. What mathematical constant is approximately equal to 2.718?
        10. What is the name of the second-highest mountain in the world?`;
      const generationResult = await model.generateContent(prompt);
      const response = await generationResult.response;
      question = await response.text();

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
    const prompt = `Question: ${question}\nAnswer: ${answer}\nIs the Answer correct? Respond with "yes" or "no" only.`;
    const generationResult = await model.generateContent(prompt);
    const response = await generationResult.response;
    const text = (await response.text()).trim();
    const isCorrect = text === 'yes';
    
    const answerGemini = await model.generateContent(`Answer this question briefly: ${question}`);
    const response2 = await answerGemini.response;
    const text2 = response2.text();

    const validationResult = isCorrect ? `The question was:\n\n"${question}"\n\n Your answer: ${answer}. \nCorrect answer is: ${text2}.` : `The question was:\n\n"${question}"\n\n Your answer: ${answer}.\nAnswer is: ${text2}.`;
    res.json({ result: validationResult });
  } catch (error) {
    console.error('Error validating answer:', error);
    res.status(500).json({ error: 'Failed to validate answer' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});