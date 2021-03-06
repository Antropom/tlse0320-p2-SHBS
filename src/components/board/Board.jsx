import React, { useState, useEffect, useRef } from 'react';
import { Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import DisplayBoard from './DisplayBoard';
import './Board.css';
import './ModalAndPopUps.css';

const Board = props => {
  const { deck, deckOp } = props;
  const [didMount, setDidMount] = useState(false);
  const [indexToDisplay, setIndexToDisplay] = useState();
  const [selectedCard, setSelectedCard] = useState();
  const [playerTurn, setPlayerTurn] = useState(false);
  const [opponentTurn, setOpponentTurn] = useState(false);
  const [isLoosingPoints, setIsLoosingPoints] = useState(false);
  const [logConsole, setLogConsole] = useState();
  const [life, setLife] = useState([]);
  const [attack, setAttack] = useState([]);
  const [damages, setDamages] = useState([[0, 10], [0, 10], false]);
  const [opponentIsWating, setOpponentIsWating] = useState(false);
  const [playerIsWating, setPlayerIsWating] = useState(false);
  const [gameStatus, setGameStatus] = useState('onGoing');
  const [redirection, setRedirection] = useState(null);
  /* audio */
  const selectAttackRef = useRef();
  const attackTargetRef = useRef();
  const youLoseRef = useRef();
  const opponentAttackRef = useRef();
  const youWinRef = useRef();
  const drawRef = useRef();
  const [stopMusic, setStopMusic] = useState(false);

  // set a boolean state to true after mounting //
  useEffect(() => {
    const randomStart = Math.floor(Math.random() * 100);
    if (randomStart > 50) {
      setOpponentIsWating(true);
    } else {
      setPlayerIsWating(true);
    }
    setDidMount(true);
  }, []);

  // Redirection to collection if no deck //
  useEffect(() => {
    if (deck.length === 0) {
      setRedirection(true);
    }
  }, [redirection]);

  // load the life & attack props in the state //
  useEffect(() => {
    if (didMount && deck[0]) {
      setLife([
        deck[0].powerstats.durability,
        deck[1].powerstats.durability,
        deck[2].powerstats.durability,
        deckOp[0].powerstats.durability,
        deckOp[1].powerstats.durability,
        deckOp[2].powerstats.durability
      ]);
      setAttack([
        deck[0].powerstats.combat,
        deck[1].powerstats.combat,
        deck[2].powerstats.combat,
        deckOp[0].powerstats.combat,
        deckOp[1].powerstats.combat,
        deckOp[2].powerstats.combat
      ]);
      setLogConsole("Let's fight !");
    }
    setRedirection(false);
  }, [deck, deckOp]);

  const handleHover = index => {
    setIndexToDisplay(index);
  };

  const clearIndex = () => {
    setIndexToDisplay();
  };

  // Losing points one by one //
  useEffect(() => {
    const oneByOne = setInterval(() => {
      /* Loses -1 while life is greater than calculated new life */
      if (didMount && isLoosingPoints) {
        const tempLife = [...life];
        if (life[damages[0][1]] > damages[0][2] && life[damages[1][1]] > damages[1][2]) {
          setIsLoosingPoints(true);
          tempLife[damages[0][1]] -= 1;
          tempLife[damages[1][1]] -= 1;
          setLife(tempLife);
        } else if (life[damages[0][1]] > damages[0][2]) {
          setIsLoosingPoints(true);
          tempLife[damages[0][1]] -= 1;
          setLife(tempLife);
        } else if (life[damages[1][1]] > damages[1][2]) {
          setIsLoosingPoints(true);
          tempLife[damages[1][1]] -= 1;
          setLife(tempLife);
        } else {
          setIsLoosingPoints(false);
          setDamages([[0, 10], [0, 10], false]);
        }
      }
    }, 10);
    return () => {
      clearInterval(oneByOne);
    };
  }, [isLoosingPoints, life]);

  // Set pause moment after the attack (depends on turn) //
  useEffect(() => {
    if (didMount && !isLoosingPoints) {
      setTimeout(() => {
        if (
          (life[0] <= 0 && life[1] <= 0 && life[2] <= 0) ||
          (life[3] <= 0 && life[4] <= 0 && life[5] <= 0)
        ) {
          if (
            life[0] <= 0 &&
            life[1] <= 0 &&
            life[2] <= 0 &&
            life[3] <= 0 &&
            life[4] <= 0 &&
            life[5] <= 0
          ) {
            setGameStatus('draw');
          } else if (life[0] <= 0 && life[1] <= 0 && life[2] <= 0) {
            setGameStatus('defeat');
          } else {
            setGameStatus('victory');
          }
        } else if (!playerTurn) {
          setOpponentIsWating(true);
        } else if (playerTurn) {
          setPlayerIsWating(true);
        }
      }, 400);
    }
  }, [isLoosingPoints]);

  // Set moment to pop-up the indication //
  useEffect(() => {
    setTimeout(() => {
      if (didMount && opponentIsWating) {
        setOpponentIsWating(false);
        /* Trigger the IA-turn use-effect */
        setOpponentTurn(!opponentTurn);
      } else if (didMount && playerIsWating) {
        setPlayerIsWating(false);
        setPlayerTurn(true);
      }
    }, 2000);
  }, [opponentIsWating, playerIsWating]);

  // IA turn //
  useEffect(() => {
    if (didMount) {
      /* Random IA choice */
      const aliveSort = [...life].map((card, i) => (card > 0 ? i : 'dead'));
      const oponentSort = [...aliveSort].splice(3).filter(card => card !== 'dead');
      const playerSort = [...aliveSort].splice(0, 3).filter(card => card !== 'dead');
      const randomAttacker = oponentSort[Math.floor(Math.random() * oponentSort.length)];
      const randomTarget = playerSort[Math.floor(Math.random() * playerSort.length)];
      /* Apply attack */
      const newLife =
        life[randomTarget] - attack[randomAttacker] > 0
          ? life[randomTarget] - attack[randomAttacker]
          : 0;
      const newLifeReturn =
        life[randomAttacker] - attack[randomTarget] > 0
          ? life[randomAttacker] - attack[randomTarget]
          : 0;
      setTimeout(() => {
        setDamages([
          [attack[randomAttacker], randomTarget, newLife],
          [attack[randomTarget], randomAttacker, newLifeReturn],
          false
        ]);
        opponentAttackRef.current.play();
        // setLife(tempLife);
        setIsLoosingPoints(true);
        if (randomAttacker) {
          if (newLife === 0 && newLifeReturn === 0) {
            setLogConsole(
              `${deckOp[randomAttacker - 3].name} and ${deck[randomTarget].name} killed each other!`
            );
          } else if (newLife === 0) {
            setLogConsole(`${deckOp[randomAttacker - 3].name} killed ${deck[randomTarget].name}!`);
          } else if (newLifeReturn === 0) {
            setLogConsole(`${deck[randomTarget].name} killed ${deckOp[randomAttacker - 3].name}!`);
          } else {
            setLogConsole(
              `${deckOp[randomAttacker - 3].name} deals ${attack[randomAttacker]} damages to ${
                deck[randomTarget].name
              } who counterattacks for ${attack[randomTarget]} damages...`
            );
          }
        }
        setPlayerTurn(true);
      }, 400);
    }
  }, [opponentTurn]);

  // User Turn //
  const handleClick = e => {
    const index = Number(e.currentTarget.getAttribute('index'));
    /* Select attacker */
    if (index < 3 && life[index] > 0 && playerTurn && !isLoosingPoints) {
      selectAttackRef.current.play();
      setSelectedCard(index);
      /* Select target */
    } else if (index >= 3 && life[index] > 0 && selectedCard !== undefined) {
      /* Apply attack */
      const newLife =
        life[index] - attack[selectedCard] > 0 ? life[index] - attack[selectedCard] : 0;
      const newLifeReturn =
        life[selectedCard] - attack[index] > 0 ? life[selectedCard] - attack[index] : 0;
      setDamages([
        [attack[index], selectedCard, newLifeReturn],
        [attack[selectedCard], index, newLife],
        true
      ]);
      attackTargetRef.current.play();
      setSelectedCard();
      setIsLoosingPoints(true);
      if (newLife === 0 && newLifeReturn === 0) {
        setLogConsole(
          `${deck[selectedCard].name} and ${deckOp[index - 3].name} killed each other!`
        );
      } else if (newLife === 0) {
        setLogConsole(`${deck[selectedCard].name} killed ${deckOp[index - 3].name}!`);
      } else if (newLifeReturn === 0) {
        setLogConsole(`${deckOp[index - 3].name} killed ${deck[selectedCard].name}!`);
      } else {
        setLogConsole(
          `${deck[selectedCard].name} deals ${attack[selectedCard]} damages to ${
            deckOp[index - 3].name
          } who counterattacks for ${attack[index]} damages...`
        );
      }
      setPlayerTurn(false);
    }
  };

  // Local storage //
  useEffect(() => {
    if (gameStatus !== 'onGoing') {
      if (gameStatus === 'victory') {
        setStopMusic(true);
        youWinRef.current.play();
        const victoryCount = window.localStorage.getItem('myVictories')
          ? JSON.parse(window.localStorage.getItem('myVictories'))
          : 0;
        const result = JSON.stringify(victoryCount + 1);
        window.localStorage.setItem('myVictories', result);
      } else if (gameStatus === 'defeat') {
        setStopMusic(true);
        youLoseRef.current.play();
        const defeatCount = window.localStorage.getItem('myDefeats')
          ? JSON.parse(window.localStorage.getItem('myDefeats'))
          : 0;
        const result = JSON.stringify(defeatCount + 1);
        window.localStorage.setItem('myDefeats', result);
      } else if (gameStatus === 'draw') {
        setStopMusic(true);
        drawRef.current.play();
        const drawCount = window.localStorage.getItem('myDraws')
          ? JSON.parse(window.localStorage.getItem('myDraws'))
          : 0;
        const result = JSON.stringify(drawCount + 1);
        window.localStorage.setItem('myDraws', result);
      }
      const playedCount = window.localStorage.getItem('myPlayedCount')
        ? JSON.parse(window.localStorage.getItem('myPlayedCount'))
        : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      playedCount[deck[0].index] += 1;
      playedCount[deck[1].index] += 1;
      playedCount[deck[2].index] += 1;

      const all = JSON.stringify(playedCount);
      window.localStorage.setItem('myPlayedCount', all);
    }
  }, [gameStatus]);

  return (
    <>
      {redirection && <Redirect to="/Collection" />}
      {didMount && (
        <DisplayBoard
          opponentDeck={deckOp}
          playerDeck={deck}
          handleClick={handleClick}
          handleHover={handleHover}
          clearIndex={clearIndex}
          life={life}
          attack={attack}
          selectedCard={selectedCard}
          opponentIsWating={opponentIsWating}
          indexToDisplay={indexToDisplay}
          logConsole={logConsole}
          playerIsWating={playerIsWating}
          damages={damages}
          gameStatus={gameStatus}
          selectAttackRef={selectAttackRef}
          attackTargetRef={attackTargetRef}
          youLoseRef={youLoseRef}
          opponentAttackRef={opponentAttackRef}
          drawRef={drawRef}
          youWinRef={youWinRef}
          stopMusic={stopMusic}
        />
      )}
    </>
  );
};
Board.propTypes = {
  deckOp: PropTypes.instanceOf(Array).isRequired,
  deck: PropTypes.instanceOf(Array).isRequired
};
export default Board;
