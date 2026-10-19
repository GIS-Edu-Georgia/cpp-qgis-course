---
n: 09
title: STL: კონტეინერები და ალგორითმები
en: The Standard Template Library
eyebrow: მონაცემთა სტრუქტურები
topics: vector · map · range-for · lambda · sort · count_if · accumulate
---

STL არის C++-ის სტანდარტული ბიბლიოთეკა კონტეინერებისა და ალგორითმებისთვის. QGIS ძირითადად Qt-ის კონტეინერებს იყენებს (თავი 10), მაგრამ STL-ის ცოდნა მაინც აუცილებელია: ორივეს ლოგიკა ერთია და ბევრი QGIS ფუნქცია STL ტიპებს აბრუნებს.

## vector — დინამიური მასივი

`std::vector<T>` არის Python-ის `list`-ის ანალოგი, ოღონდ ყველა ელემენტი ერთი ტიპისაა.

::: compare
```python
areas = [12.5, 7.0, 30.5, 4.0]
areas.append(9.0)
print(len(areas))
for a in areas:
    print(a)
```

```cpp
std::vector<double> areas = {12.5, 7.0, 30.5, 4.0};
areas.push_back(9.0);
std::cout << areas.size() << "\n";
for (double a : areas) {
  std::cout << a << "\n";
}
```
:::

| ოპერაცია | Python | C++ |
|---|---|---|
| დამატება | `append(x)` | `push_back(x)` |
| ზომა | `len(a)` | `a.size()` |
| ელემენტი | `a[0]` | `a[0]` |
| ბოლო | `a[-1]` | `a.back()` |
| გასუფთავება | `a.clear()` | `a.clear()` |

::: tip წესი
დიდი ელემენტების ციკლში გამოიყენე `const auto &`: `for (const auto &feature : features)`. ასე ელემენტი არ დაკოპირდება (თავი 05).
:::

## map — გასაღები → მნიშვნელობა

`std::map<K, V>` არის `dict`-ის ანალოგი. გასაღებებს ავტომატურად ალაგებს ზრდადობით.

```cpp map.cpp
#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> population = {
        {"Tbilisi", 1200000},
        {"Batumi", 170000},
        {"Kutaisi", 147000},
    };

    population["Rustavi"] = 125000;

    for (const auto &[city, people] : population) {
        std::cout << city << ": " << people << "\n";
    }
    return 0;
}
```

```output
Batumi: 170000
Kutaisi: 147000
Rustavi: 125000
Tbilisi: 1200000
```

::: note
მოსახლეობის რიცხვები აქ მიახლოებითი და საილუსტრაციოა, მიზანი კონტეინერის ჩვენებაა. `const auto &[city, people]` (structured binding, C++17) ერთდროულად ორივეს ამოიღებს.
:::

::: warn
`population["Poti"]` — თუ გასაღები არ არსებობს, `map` ჩუმად შექმნის ახალ ჩანაწერს ნულოვანი მნიშვნელობით. არსებობის შესამოწმებლად გამოიყენე `population.find("Poti") != population.end()` ან `population.count("Poti")`.
:::

## ალგორითმები

`<algorithm>` და `<numeric>` გვაძლევს მზა ოპერაციებს: დალაგება, დათვლა, ჯამი.

```cpp algo.cpp
#include <algorithm>
#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<double> areas = {12.5, 7.0, 30.5, 4.0};

    std::sort(areas.begin(), areas.end(),
              [](double a, double b) { return a > b; });

    for (double a : areas) std::cout << a << " ";
    std::cout << "\n";

    double total = std::accumulate(areas.begin(), areas.end(), 0.0);
    std::cout << "Total: " << total << "\n";
    std::cout << "Average: " << total / areas.size() << "\n";

    long big = std::count_if(areas.begin(), areas.end(),
                             [](double a) { return a > 10.0; });
    std::cout << "Parcels > 10 ha: " << big << "\n";
    return 0;
}
```

```output
30.5 12.5 7 4 
Total: 54
Average: 13.5
Parcels > 10 ha: 2
```

## lambda — უსახელო ფუნქცია

`[](double a, double b) { return a > b; }` არის lambda: ფუნქცია, რომელიც ადგილზევე იწერება. Python-ში ეს `lambda a, b: a > b`-ს ჰგავს. `[]` კვადრატულ ფრჩხილებში შეიძლება გარე ცვლადების „დაჭერა“:

```cpp
double limit = 10.0;
auto isBig = [limit](double a) { return a > limit; };
```

QGIS-ში lambda-ებს ხშირად გამოიყენებენ signal-ებთან დასაკავშირებლად (თავი 10).

## ძებნა

```cpp
auto it = std::find_if(areas.begin(), areas.end(),
                       [](double a) { return a > 20.0; });
if (it != areas.end()) {
    std::cout << "First > 20: " << *it << "\n";
}
```

`find_if` აბრუნებს **iterator-ს**: ელემენტზე მიმთითებელს (მაჩვენებლის მსგავს ობიექტს). ბოლოს `end()` ნიშნავს „ვერ ვიპოვე“. `*it` იღებს მნიშვნელობას. QGIS-ში `QgsFeatureIterator` ამავე იდეაზეა აგებული.

## სავარჯიშო და შეჯამება

::: exercise სავარჯიშო
1. დაწერე `std::vector<Point>` ხუთი წერტილით და `std::sort`-ით დაალაგე x-ის მიხედვით.
2. შექმენი `std::map<std::string, double>`: მდინარე → სიგრძე კმ-ში (`{"Mtkvari", 1364}`, `{"Rioni", 327}`, `{"Alazani", 407}`). იპოვე ყველაზე გრძელი (`std::max_element` მიმართე დოკუმენტაციას).
3. `count_if`-ით დათვალე მდინარეები, რომლებიც 400 კმ-ზე გრძელია.
:::

::: summary შეჯამება
- `vector` = list, `map` = dict, ორივე ტიპიზებულია.
- ალგორითმები იღებენ დიაპაზონს `begin()`–`end()` და lambda-ს.
- iterator — მაჩვენებლის მსგავსი ობიექტი კონტეინერში გადასაადგილებლად.
:::
