import store from './../index';
import GameController from './GameController';

import badFile from './../sound/bad.mp3'
import goodFile from './../sound/type.mp3';
import successFile from './../sound/success.mp3';
import { strikeIn } from '../actions';

import shredTweet from './../utilities/ShredTweet';

let badSound = new Audio(badFile);
let goodSound = new Audio(goodFile);
let successSound = new Audio(successFile);

export default class GuessAuthor {
    constructor(newTweet) {

        console.log("constructing GuessAuthor");
        this.curTweet = newTweet;
        this.type = 'GuessAuthor';

        this.friendOptions = [];
        this.lives = 3;

        this.parent = new GameController();
    }

    getLives() {
        return this.lives;
    }

    newGame() {
        //invoke method from GameController
        this.parent.newGame();
    }

    //return 5 random friends
    async getRandomFriends(friendList, init) {
        let state;
        let friends = null;
        if (store !== undefined) {
            state = store.getState();
            if (friendList !== undefined) {
                friends = friendList;
            }
            else {
                friends = state.game.parsedFriends;
            }
        }
        else {
            if (friendList !== undefined) {
                friends = friendList;
            }
            else {
                friends = await this.parent.fetchAllFriends();
            }
        }

        console.log(friends);

        let correctAuthor = this.curTweet.user;

        correctAuthor.correct = true;

        let friendOptions = [];

        friendOptions.push(correctAuthor);

        for (let i = 0; i < 5; i++) {
            if (friends !== null) {
                let randIdx = getRandomUniqueIndex(friends.length - 1);
                let randFriend = friends[randIdx];
                while (randFriend.handle === correctAuthor.handle) {
                    randIdx = getRandomUniqueIndex(friends.length - 1);
                    randFriend = friends[randIdx];
                }
                randFriend.correct = false;
                friendOptions.push(randFriend);
            }
        }

        friendOptions = shuffle(friendOptions);

        this.friendOptions = friendOptions;

        if (!init) {
            this.parent.updateGame(this);
        }
    }


    handleDrop(correct) {
        //correct drop! do some things
        if (correct) {
            if (store.getState().ui.playSound === true) {
                goodSound.play();
            }
            this.success();
        }
        //incorrect drop! do some other things
        else if (!correct) {
            this.incorrectDrop();
        }
    }

    incorrectDrop() {
        //subtract life
        this.lives = this.lives - 1;
        if (store.getState().ui.playSound === true) {
			badSound.play();
		}
        if (this.lives === 0) {
            this.fail();
        }
        else {
            //THIS IS WHERE STRIKE ANIMATION FIRING CODE SHOULD GO
            store.dispatch(strikeIn());
            this.parent.updateGame(this);
        }
    }

    async success() {
        //get the next tweet
        if (store.getState().ui.playSound === true) {
			successSound.play();
		}
        await this.parent.animateOut();
        this.status = 'Success'
        this.type = 'Complete';
        this.parent.updateGame(this);
    }

    async fail() {
        //display some sort of failure message
        //proceed to next tweet
        this.parent.updateGame(this);
        await shredTweet();
        await this.parent.animateOut();
        this.status = 'Fail'
        this.type = 'Complete';
        this.parent.updateGame(this);
        
    }

    static fromJSON(serializedJson) {
        let newInstance = new GuessAuthor(serializedJson.curTweet);
        newInstance.parent = new GameController();
        newInstance.type = 'GuessAuthor';
        return newInstance;
    }

}

let usedIdx = [];

var getRandomUniqueIndex = max => {
    let newIdx = Math.floor(Math.random() * Math.floor(max));
    while (usedIdx.includes(newIdx) && usedIdx.length < max) {
        newIdx = Math.floor(Math.random() * Math.floor(max));
    }
    usedIdx.push(newIdx);
    return newIdx;
};

var shuffle = (array) => {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}