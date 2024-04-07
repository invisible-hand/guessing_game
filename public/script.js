const questionElement = document.getElementById('question');
const answerElement = document.getElementById('answer');
const submitButton = document.getElementById('submit');
const skipButton = document.getElementById('skip');
const resultElement = document.getElementById('result');
const difficultyLevelElement = document.getElementById('difficultyLevel');
const correctCountElement = document.getElementById('correctCount');
const incorrectCountElement = document.getElementById('incorrectCount');

let currentQuestion = '';
let correctCount = 0;
let incorrectCount = 0;
let difficultyLevel = 1;
let streak = 0;


async function fetchQuestion() {
  try {
    const response = await fetch(`/api/question?difficulty=${difficultyLevel}`);
    const data = await response.json();
    currentQuestion = data.question;
    questionElement.innerText = currentQuestion;
  } catch (error) {
    console.error('Error fetching question:', error);
  }
}

async function checkAnswer() {
  const answer = answerElement.value.trim();
  if (answer !== '') {
    try {
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentQuestion, answer }),
      });
      const data = await response.json();
      resultElement.innerText = data.result;
      if (data.result.toLowerCase().includes('correct')) {
        correctCount++;
        correctCountElement.innerText = correctCount;
        streak++;
        document.getElementById('streak').innerText = streak;
        difficultyLevel = Math.min(10, difficultyLevel + 1);
      } else {
        incorrectCount++;
        incorrectCountElement.innerText = incorrectCount;
        streak = 0;
        document.getElementById('streak').innerText = streak;
        difficultyLevel = Math.max(1, difficultyLevel - 1);
      }
      difficultyLevelElement.innerText = difficultyLevel;
      answerElement.value = '';
      fetchQuestion();
    } catch (error) {
      console.error('Error checking answer:', error);
    }
  }
}

answerElement.addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    checkAnswer();
  }
});



function skipQuestion() {
  fetchQuestion();
}

submitButton.addEventListener('click', checkAnswer);
skipButton.addEventListener('click', skipQuestion);

fetchQuestion();