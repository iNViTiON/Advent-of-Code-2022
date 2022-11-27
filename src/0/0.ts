import { interval } from 'rxjs';

console.log('test');
interval(1000).subscribe(i => console.log(i));