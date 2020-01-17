import uniqid from 'uniqid';
export default class List {
    constructor(){
        this.items = [];
    }
    addItem(count,unit,ingredient){
        const item = {
            id: uniqid(),
            count,
            unit,
            ingredient
        }
        this.items.push(item);
        return item;
    }

    deleteItem(id) {
        //findIndex return a index match the condition
        const index = this.items.findIndex(el =>{
            el.id === id;
        });
        //[2,4,8] splice(1,2) -> returns[4,8], original array is [2]
        //[2,4,8] slice(1,2) -> return 4, original is [2,4,8]
        this.items.splice(index,1);
    }

    updateCount(id,newCount){
        //find return an element match the conditino
        this.items.find(el => el.id===id).count = newCount;
    }
}