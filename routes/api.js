'use strict';
const BoardModel = require('../model/msg-model').Board;
const ThreadModel = require('../model/msg-model').Thread;
const ReplyModel = require('../model/msg-model').Reply;

let date = new Date()
module.exports = function (app) {
  
  app
   .route('/api/threads/:board')
   .post(async (req,res) => {
      const {text, delete_password} = req.body
      let board = req.params.board || req.body.board
      
      const newThread = new ThreadModel({
         text: text,
         delete_password: delete_password
      })
      //console.log('newThread', newThread)
      const foundBoard = await BoardModel.findOne({ name: board})
         if(!foundBoard){
            const newBoardModel = new BoardModel({
               name     : board,
               threads  : [newThread]
            })
            //console.log('newBoardModel', newBoardModel)
            const savedNewBoard = await newBoardModel.save()
            //console.log('newBoardData', savedNewBoard)
            if(!savedNewBoard){
               res.status(400).send('error with saving to database')
            } else{
               res.redirect('/b/' + board)
            }   
         } else {
            foundBoard.threads.push(newThread)
            const savedFoundBoard = await foundBoard.save()
               //console.log('savedFoundBoard', savedFoundBoard)
               if(!savedFoundBoard){
                  res.status(400).send('error with saving to database')
               } else{
                  res.redirect('/b/' + board)
               }    
         }
   })

   .get(async(req,res)=>{
      const board = req.params.board
      const foundBoard = await BoardModel.findOne({name: board})
      
      if(!foundBoard){
         console.log('board not found')
         res.status(400).send('Board has not been found')
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
         let slicedThreads = threads.slice(0,10)
      res.json(slicedThreads)
      }

   })

   .put(async (req,res) => {
      const {thread_id} = req.body
      let board = req.params.board
      try{
         const Board = await BoardModel.findOne({name: board})
         if(!Board){
            res.send('board not found')
         } else {
            let reportedThread = Board.threads.id(thread_id);
            reportedThread.reported = true;
            reportedThread.bumped_on = date;
            await Board.save()
            res.send('reported')
         } 
      } catch (error){
         console.log(error.message)
      }
   })

   .delete(async (req,res)=>{
      const {thread_id, delete_password } = req.body
      let board = req.params.board
      const foundBoard = await BoardModel.findOne({name:board})
      if(!foundBoard){
         res.send('board not found')
      } else {   
      let threadForDel = foundBoard.threads.id(thread_id)
      if(threadForDel.delete_password === delete_password){
            foundBoard.threads.pull(threadForDel)
            await foundBoard.save()
            res.send('success')
         } else {
            res.send('incorrect password')
         }
      }
   }
   )

  app
   .route('/api/replies/:board')
   .post(async(req,res)=>{
      const {thread_id, text, delete_password} = req.body
      const board = req.params.board
      const NewReplay = new ReplyModel({
         text: text,
         delete_password: delete_password
      })
      const Reply = await BoardModel.findOne({ name: board })
      if(!Reply){
         res.json('Board not found')
      }else{
         
      const date =new Date((new Date().toLocaleString('en', {timeZone: 'Europe/Madrid'}))
)
         console.log(date)
         let threadToAddReply = Reply.threads.id(thread_id)
         threadToAddReply.bumped_on = date;
         threadToAddReply.replies.push(NewReplay)
         let SavedBoard  = await Reply.save()

         res.redirect('/b/' + board)
      }

   })
   .get(async(req,res)=>{
      const { thread_id } = req.query
      const board = req.params.board
      const Board = await BoardModel.findOne({ name: board })
      if(!Board){
         res.json('Board not found')
      }else{
         const thread = Board.threads.id(thread_id)
         res.json(thread)
      }

   })
   .put(async(req,res)=>{
      const {thread_id, reply_id} = req.body
      const board = req.params.board
      try{
         const Board = await BoardModel.findOne({name: board})
         if(!Board){
            res.send( 'Board not found')
         }else{
            let date = new Date()
            let thread = Board.threads.id(thread_id)
            let reply = thread.replies.id(reply_id)
            reply.reported = true;
            reply.bumped_on = date;
            await Board.save()

            res.send('reported')
         }
      } catch(error){
         console.log(error.message)
      }
   })
   .delete(async(req,res)=>{
      const board = req.params.board
      const {thread_id, reply_id, delete_password} = req.body
      try {
         const Board = await BoardModel.findOne({name: board})
         let thread = Board.threads.id(thread_id)
         let reply = thread.replies.id(reply_id)
         if (reply.delete_password === delete_password){
            reply.text = '[deleted]'
            await Board.save()
            res.send('success')
         }else{
            res.send('incorrect password')
         }
      } catch (error) {
         console.log(error.message)
      }

   })
};
