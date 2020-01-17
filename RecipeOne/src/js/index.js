import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader,clearLoader} from './views/base';
import Likes from './models/Likes';

/** global state of the app
 * -search object
 * -current recipe object
 * -shopping list object
 * -liked recipes
 */

 const state = {};
window.state = state;
 /**
  * Search controller
  */
 const controlSearch = async() => {
     //1) Get query from view
     const query = searchView.getInput();
    
     if(query){
         //2) New search object and add to state
            state.search = new Search(query);
            console.log(state.search);
         //3) Prepare UI for results
            searchView.clearInput();
            searchView.clearResults();
            renderLoader(elements.searchRes);

            try{
                //4) search for recipes
                await state.search.getResults();
       
                //5) render results on UI
                   clearLoader();
                   searchView.rederResults(state.search.result);
            }catch(err){
                alert('Something wrong with the search...');
                clearLoader();
            }

     }
 }
 elements.searchForm.addEventListener('submit', e =>{
     e.preventDefault();
     controlSearch();
 });

 elements.searchResPages.addEventListener('click',e=> {
     const btn = e.target.closest('.btn-inline');
     //<button class="btn-inline results__btn--next" data-goto="3">

     if(btn){
         const goToPage = parseInt(btn.dataset.goto,10);
         searchView.clearResults();
         searchView.rederResults(state.search.result,goToPage);

     }
 });

 /**
  * Recipe controller
  * {data: {…}, status: 200, statusText: "OK", headers: {…}, config: {…}, …}
data:
recipe:
publisher: "The Pioneer Woman"
ingredients: (17) ["1-1/3 cup Shortening (may Substitute Butter)", "1-1/2 cup Sugar", "1 teaspoon Orange Zest", "1 teaspoon Vanilla", "2 whole Eggs", "8 teaspoons Whole Milk", "4 cups All-purpose Flour", "3 teaspoons Baking Powder", "1/2 teaspoon Salt", "2 jars (13 Ounces Each) Marshmallow Creme", "2 packages (8 Ounces Each) Cream Cheese", "Peaches", "Kiwi Fruit", "Blueberries", "Pears", "Raspberries", "Other Fruit Optional"]
source_url: "http://thepioneerwoman.com/cooking/2012/01/fruit-pizza/"
recipe_id: "46956"
image_url: "http://forkify-api.herokuapp.com/images/fruitpizza9a19.jpg"
social_rank: 100
publisher_url: "http://thepioneerwoman.com"
title: "Deep Dish Fruit Pizza"
  */

// const r = new Recipe(46956);
// r.getRecipe();
// console.log(r);
const controlRecipe =async () =>{
    const id= window.location.hash.replace('#','');

    if(id){
        //prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highligh selected search item
        if(state.search){  searchView.highlightSelected(id);
        }

        //create new recipe object
        state.recipe = new Recipe(id);
        
        try{
        //get recipe data and parse ingredients
        await state.recipe.getRecipe();

        state.recipe.parseIngredients();
        //calculate servings and time
        state.recipe.calTime();
        state.recipe.calServings();
        //render recipe

        clearLoader();
        recipeView.renderRecipe(
            state.recipe,
            state.likes.isLiked(id)
            );
        }catch(err){

            alert(`Error processing recipe! ${err}`);
        }

    }
}
// use this when click recipe to change url  <a class="results__link " href="#${recipe.recipe_id}">
//from http://localhost:8080/?#17796 get #17796
// window.addEventListener('hashchange', controlRecipe);
// window.addEventListener('load',controlRecipe);

['hashchange','load'].forEach(event => window.addEventListener(event,controlRecipe));

/**
 * List controller
 */
const controlList = () => {
    //create a new list if there is none yet
    if(!state.list) state.list = new List();

    //add each ingredient to the list
   state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count,el.unit,el.ingredient);
        listView.renderItem(item);

    });
}

//Handle delete and update list item events
elements.shopping.addEventListener('click',e => {
    //click inside shopping area, find the closet item, then get the id
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')){
        ///delete from state
        state.list.deleteItem(id);
    
        //delete from UI
        listView.deleteItem(id);
    } else if(e.target.matches('.shopping__count-value')){
        const val = parseFloat(e.target.value,10);
        state.list.updateCount(id,val);
    }
})

/**
 * Like controller
 */


const controlLike = () =>{
    if(!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //user Not like the current recipe
    if(!state.likes.isLiked(currentID)){
        //Add like to the state
        const newLike = state.likes.addLike(
                currentID,
                state.recipe.title,
                state.recipe.author,
                state.recipe.img
            );
        //Toggle the like button
            likesView.toggleLikeBtn(true);
        //Add like to UI list

            likesView.renderLike(newLike);

    //use Has liked the current recipe
    }else {
        //remove like from the state
        state.likes.deleteLike(currentID);
        //Toggle the like button
        likesView.toggleLikeBtn(false);
        //remove like from UI list
        likesView.deleteItem(currentID);

    }

    likesView.toggleLikeMenu(state.likes.getNumLikes()); 
}

//Restore liked recipes on page
window.addEventListener('load', ()=> {
    state.likes = new Likes();

    //restore likes
    state.likes.readStorage();

    //Toggle like menu button
    likesView.toggleLikeMenu(state.likes.getNumLikes()); 

    //render the existing likes
    state.likes.likes.forEach(like => likesView.renderLike(like));
})


//handing recipe button clicks
elements.recipe.addEventListener('click', e=>{
    if(e.target.matches('.btn-decrease, .btn-decrease *')){
        //Decrease button clicked
        if(state.recipe.servings >1){
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
        
    } else if(e.target.matches('.btn-increase, .btn-increase *')){
        //Increase button clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
        //handle add ingredients to shopping list button
        controlList();
    } else if(e.target.matches('.recipe__love,.recipe__love *')){

        //like contorller
        controlLike();
    }
});

