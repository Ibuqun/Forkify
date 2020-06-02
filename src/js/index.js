import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as likesView from './views/likesView';
import * as listView from './views/listView';
import { elements,  renderLoader, clearLoader } from './views/base';
/** Global state of the app
 * Search object
 * Current recipe object
 * Shopping list object
 * Liked recipes
 */
const state = {};

/**
 * SEARCH CONTROLLER
 */

const controlSearch = async () => {
    //1. get the query from the view
    const query = searchView.getInput();
    //console.log(query);

    if (query) {
        //2. Create new search object and add to state
        state.search = new Search(query);
        
        //3.Prepare UI for results.
        searchView.clearInput();
        searchView.clearResults();
        renderLoader(elements.searchRes);
        try{
            //4.Search fro recipes.
        await state.search.getResults();

        //5. Render results on UI.
        searchView.renderResults(state.search.result);
        clearLoader();
        } catch (error) {
            alert("Something wrong with the search...");
            clearLoader();
        }  
    }
}

elements.searchForm.addEventListener('submit', e => {
    e.preventDefault();
    controlSearch();
    
});

elements.searchResPages.addEventListener('click', e => {
    const btn = e.target.closest('.btn-inline');
    if (btn) {
        const goToPage = parseInt(btn.dataset.goto, 10);
        searchView.clearResults();
        searchView.renderResults(state.search.result, goToPage);
    }
});

/**
 * RECIPE CONTROLLER
 */
const controlRecipe = async () => {
    //Get the ID from url
    const id = window.location.hash.replace('#', '');
    console.log(id);

    if (id) {
        //Prepare UI for changes
        recipeView.clearRecipe();
        renderLoader(elements.recipe);

        //Highlight the selected search item
        if (state.search) searchView.highlightSelected(id);

        //Create new recipe object
        state.recipe = new Recipe(id);
        try{
            //Get recipe data and parse ingredients
        await state.recipe.getRecipe();
        state.recipe.parseIngredients();
        
        //Calculate time and servings
        state.recipe.calcTime();
        state.recipe.calcServings();

        //Render recipe
        clearLoader();
        recipeView.renderRecipe(
            state.recipe, state.likes.isLiked(id));
        } catch (error) {
            console.log(error);
            alert("Error processing recipe!");
        }
        

    }
};

/**
 * LIST CONTROLLER
 */

 const controlList = () => {
    // Create a new list if there is none yet
    if (!state.list) state.list = new List();

    //Add each ingredient to the list and UI
    state.recipe.ingredients.forEach(el => {
        const item = state.list.addItem(el.count, el.unit, el.ingredient);
        listView.renderItem(item);
    }); 
 };

 //Handle delete and update list item events
 elements.shopping.addEventListener('click', e => {
    const id = e.target.closest('.shopping__item').dataset.itemid;

    //Handle the delete button
    if(e.target.matches('.shopping__delete, .shopping__delete *')) {
        //Delete from state and UI
        state.list.deleteItem(id);
        listView.deleteItem(id);
        //Handle the count update
    } else if (e.target.matches('.shopping__count-value')) {
        const val = parseFloat(e.target.value);
        state.list.updateCount(id, val);
    }
 });

 //window.addEventListener('hashchange', controlRecipe);
 //window.addEventListener('load', controlRecipe);
['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

/**
 * LIKES CONTROLLER
 */

 state.likes = new Likes(); //testing 
 likesView.toggleLikeMenu(state.likes.getNumberOfLikes()); //testing 

const controlLike = () => {
    if (!state.likes) state.likes = new Likes();
    const currentID = state.recipe.id;

    //User has not yet liked current recipe
    if (!state.likes.isLiked(currentID)) {
        //Add like to the state
        const newLike = state.likes.addLike (
            currentID,
            state.recipe.title,
            state.recipe.author,
            state.recipe.img
        );
        
        //Toggle the button
        likesView.toggleLikeBtn(true);
        
        //Add to the UI list
        likesView.renderLike(newLike);
        
    //User has liked current recipe
    } else {
        //Remove like to the state
        state.likes.deleteLike(currentID);
        //Toggle the button
        likesView.toggleLikeBtn(false);
        //Remove from the UI list
        likesView.deleteLike(currentID);
    }
    likesView.toggleLikeMenu(state.likes.getNumberOfLikes());
};


//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
    if(e.target.matches('.btn-decrease, .btn-decrease *')) {
        //Decrease button is clicked
        if (state.recipe.servings > 1) {
            state.recipe.updateServings('dec');
            recipeView.updateServingsIngredients(state.recipe);
        }
        
    } else if(e.target.matches('.btn-increase, .btn-increase *')) {
        //Increase button is clicked
        state.recipe.updateServings('inc');
        recipeView.updateServingsIngredients(state.recipe);
    } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        //Add ingredients to shopping list
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *' )) {
        //Like conroller
        controlLike();
    }
});

window.l = new List 