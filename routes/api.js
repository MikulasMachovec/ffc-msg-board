'use strict';

const { Board } = require('../model/msg-model');

const BoardModel = require('../model/msg-model').Board;
const ThreadModel = require('../model/msg-model').Thread;
const ReplyModel = require('../model/msg-model').Reply;



module.exports = function (app) {
  
  app
   .route('/api/threads/:board')
   .post(async (req,res) => {
      const {text, delete_password} = req.body
      let board = req.body.board
      if(!board){
         board = req.params.board
      }
      const newThread = new ThreadModel({
         text: text,
         delete_password: delete_password,
         replies: []
      })
      console.log('newThread', newThread)
      const foundBoard = await BoardModel.findOne({ name: board})
         if(!foundBoard){
            const newBoardModel = new BoardModel({
               name     : board,
               threads  : [newThread]
            })
            console.log('newBoardModel', newBoardModel)
            const savedNewBoard = await newBoardModel.save()
            console.log('newBoardData', savedNewBoard)
            if(!savedNewBoard){
               console.log(err)
               res.send('error while saving to database')
            } else{
               res.json(newThread)
            }   
         } else {
            foundBoard.threads.push(newThread)
            const savedFoundBoard = await foundBoard.save()
               console.log('savedFoundBoard', savedFoundBoard)
               if(!savedFoundBoard){
                  console.log(err)
                  res.send('error while saving to database')
               } else{
                  res.json(newThread)
               }    
         }
      })
   .get(async(req,res)=>{
      const board = req.params.board
      const foundBoard = await BoardModel.findOne({name: board})
      
      if(!foundBoard){
         console.log('board not found')
         res.json({error: 'Board has not been found'})
      } else {
         const threads = foundBoard.threads.map((thread)=>{
            const{
               _id,
               text,
               created_on,
               bumped_on,
               reported,
               delete_password,
               replies
            } = thread
            return{
               _id,
               text,
               created_on,
               bumped_on,
               reported,
               delete_password,
               replies,
               replycount: thread.replies.length
            }
            
         })
      res.json(threads)
      }

   })


  app.route('/api/replies/:board');

};
