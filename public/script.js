const questionElement = document.getElementById('question');
const answerElement = document.getElementById('answer');
const submitButton = document.getElementById('submit');
const skipButton = document.getElementById('skip');
const resultElement = document.getElementById('result');
const correctCountElement = document.getElementById('correctCount');
const incorrectCountElement = document.getElementById('incorrectCount');
const livesCountElement = document.getElementById('livesCount');

let currentQuestion = '';
let correctCount = 0;
let incorrectCount = 0;
let difficultyLevel = 1;
let lives = 3;

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
      console.log('Current question:', currentQuestion);
      const response = await fetch('/api/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: currentQuestion, answer }),
      });
      const data = await response.json();
      
      if (data.isCorrect) {
        resultElement.innerHTML = `<p class="text-4xl text-green-500 font-bold">Correct answer!</p>`;
        correctCount++;
        correctCountElement.innerText = correctCount;
        difficultyLevel = Math.min(10, difficultyLevel + 1);
      } else {
        resultElement.innerHTML = `<p class="text-4xl text-red-500 font-bold">Wrong answer.</p>`;
        incorrectCount++;
        incorrectCountElement.innerText = incorrectCount;
        lives--;
        livesCountElement.innerText = lives;
        if (lives === 0) {
          showGameOver();
          return;
        }
        difficultyLevel = Math.max(1, difficultyLevel - 1);
      }
      
      resultElement.innerHTML += `<p class="mt-4 text-xl">${data.result.replace(/\n/g, '<br>')}</p>`;
      
      answerElement.value = '';
      await fetchQuestion();
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

function showGameOver() {
  document.getElementById('finalCorrectCount').innerText = correctCount;
  document.getElementById('finalIncorrectCount').innerText = incorrectCount;
  document.getElementById('finalDifficultyLevel').innerText = difficultyLevel;
  document.getElementById('gameOverModal').classList.remove('hidden');
}

document.getElementById('newGame').addEventListener('click', () => {
  resetGame();
  document.getElementById('gameOverModal').classList.add('hidden');
});

document.getElementById('shareSocial').addEventListener('click', () => {
  const shareText = `I scored ${correctCount} correct answers and reached difficulty level ${difficultyLevel} in the Guessing Game! Can you beat my score? 💪`;
  const shareUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText);
  window.open(shareUrl, '_blank');
});

function skipQuestion() {
  fetchQuestion();
}

function startGame() {
  document.getElementById('welcomeModal').classList.add('hidden');
  resetGame();
}

function resetGame() {
  currentQuestion = '';
  correctCount = 0;
  incorrectCount = 0;
  difficultyLevel = 1;
  lives = 3;

  correctCountElement.innerText = correctCount;
  incorrectCountElement.innerText = incorrectCount;
  livesCountElement.innerText = lives;
  resultElement.innerHTML = '';

  fetchQuestion();
}

submitButton.addEventListener('click', checkAnswer);
skipButton.addEventListener('click', skipQuestion);
document.getElementById('startGame').addEventListener('click', startGame);

fetchQuestion();