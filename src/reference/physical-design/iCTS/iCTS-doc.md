# **iEDA软件设计说明书**

**编制：** 从祥

**审核：** iEDA课题组

**时间：** 2022年05月09日

---

## **版本修改历史**

| 版本号 |    日期    | 作者 | 简要说明 |
| :----: | :--------: | :--: | :------: |
|  0.10  | 2022-05-26 | 从祥 |          |
|        |            |      |          |
|        |            |      |          |
|        |            |      |          |
|        |            |      |          |

---

## 1. 简介

在数字电路中时钟信号是数据传输的基础，其对于同步数字电路的功能、性能、稳定性起着决定性的作用。时钟信号通常是芯片中具有最大的扇出、传输距离最长、频率最高的的信号。时钟信号需要满足特定的时序要求才能正常工作，否则错误的数据信号会被所存到寄存器中，从而导致系统功能的错误。本文将介绍的iCTS点工具旨在使时钟信号满足特定的时序要求以使数据信号被正确的锁存。本文适合想了解时钟树综合或使用iCTS点工具的读者。

### 1.1 设计需求和目标

#### 需求

* **减小时钟的扇出:** 由于时钟源的扇出很大导致时钟源的负载极大，因此需要减小时钟的扇出以减小负载。
* **满足skew约束:** 时钟信号从时钟源到达各个时钟单元时间差的最大值要小于一定的值。
* **减少线长:** 为了占用更少的布线资源，在满足时序约束的情况应使线长尽量减小。

#### 目标

时钟树综合的目标是最小化skew和延时。

### 1.2 专有名词

| **名词（缩写）** |                  **详细定义**                  |
| :--------------------- | :--------------------------------------------------: |
| 延时（latency）        |       时钟信号从时钟源到达时序单元所经过的时间       |
| 偏差 （skew）          | 时钟信号到达各个时序单元的最大延时和最小延时之间的差 |
| 扇出 （fanout）        |             单元输出端所连接的输入的个数             |

### 1.3 参考文档

[**Clock Tree Synthesis:**](https://slideplayer.com/slide/9160097/) https://slideplayer.com/slide/9160097/

### 1.4 使用说明

iCTS整体流程如下：

* 读取数据
* 构建和平衡时钟树
* 插buffer
* 评估时序
* 修时序

#### 1.4.1 环境准备

在编译和运行iCTS之前需要安装相应的工具、依赖库以及编写配置文件。

1. 工具
   iCTS 点工具使用 C++ 代码开发。在编译源代码之前需要安装 C++ 编译器和 cmake 工具。
2. 依赖库
   iCTS点工具源代码中使用了boost库，在编译前需要确保已安装boost库。linux系统如ubuntu可以使用下面的命令安装。

```
sudo apt-get install libboost-all-dev
```

iCTS通过iDB获取数据，请查看iDB点工具所需要准备的环境。
iCTS的时序评估是通过调用iSTA点工具来实现的，因此如果要进行时序评估请查看iSTA点工具所需要准备的环境。

3. 配置
   iCTS点工具提供了一个名为CtsConfig.json的配置文件。通过配置文件可以指定时序评估器（iSTA）的工作目录，数据和时序约束文件所在的位置以及时钟树构建算法的类型。配置文件内容如下：

```json
{
    "file_path": {
        "sta_work_dir": "",         // 时序评估工作目录
        "lib_path": [               // lib文件路径
            ""，""，"..."
        ],
        "sdc_path": "",            // sdc文件路径
        "input_lef_path": [        // lef文件路径
            ""，""，"..."
        ],
        "input_def_path": "",      // 输入def文件路径
        "output_def_path": "",     // 输出def文件路径
        "log_file": "",            // 记录程序运行过程的文件路径
        "gds_file": ""     
    },

    "router_type": "",             // 构建时钟树的算法类型
    "delay_type": "",              // 构建时钟树算法的延时模型
    "cluster_type": "",            // 聚类算法类型
}
```

#### 1.4.2 运行方式

上节介绍了编译前应该做好的准备工作。下面介绍如何运行iCTS。
iCTS可以作为单独的工具使用，也可以被其他工具调用。

1. 单独使用
   在单独使用iCTS时需要通过命令行将配置文件的路径传递给程序，程序通过解析该配置文件去寻找def、lef等文件所在的位置。
2. 被调用
   在作为一个模块被其他模块所调用时，其他模块可以通过 CTS 类的对象使用iCTS点工具所提供的一些功能。在实例化 CTS 类的对象时需要传递一个配置文件所在路径的参数。
   CTS.h文件提供了一些接口，通过这些接口可以使用相应模块的功能。

```C++
CTS(config_file_path);                      // CTS类单参构造函数
CTS(config_file_path, , IdbBuilder *idb);   // CTS类双参构造函数

void startDbSta();         // 从配置文件中指定的文件路径读取设计和约束文件以启动idb和ista
void readData();           // 从idb中读取数据到icts
void routing();            // 根据获取的布局后的数据构建时钟树
void synthesis();          // 向插入buffer和创建net
void evalate();            // 调用sta评估时序
void optimize();           // 修复时序
void writeDB();            // 将时钟树综合的结果通过idb写到def文件中
```

## 2. 整体设计

### 2.1 总体架构

![UJK7t8c.png](https://images.gitee.com/uploads/images/2022/0616/201118_84357be3_8138284.png)

iCTS总体架构如下图所示，其中：

* **iDB**：iDB可以视为iCTS的数据库，其中保存了从def和lef文件中读取的所有信息。可以通过 design 和 layout 分别获取 def 和 lef 相关的信息。
* **data adapter**: 数据适配层，iCTS通过数据适配层从iDB中读写数据。
* **database**: iCTS的数据库，保存从iDB中获取的数据以及程序的运行结果。
* **iSTA**: 静态时序评估器。
* **iTO**: 时序优化工具，修复时序。
* **module**: module模块是iCTS的主要功能模块。包含router、synthesis、evaluator、optimizer。
* **router**: router模块包含聚类（cluster）、拓扑构建(topology)以及时钟树构建算法（DME）。
* **cluster**: 聚类包括kmeans聚类、层次聚类。
* **topology**: 拓扑用于保存时钟树中各个节点之间的关系。
* **DME**: 构建时钟树的算法。其中包括ZST、BST、UST算法。（其中UST算法暂未实现）
* **synthesis**: 包含插入buffer和构建net两个功能。
* **evaluator**: evalutor是静态时序评估器（iSTA）的封装，用以评估skew和slew等。
* **optimizer**: optimizer是时序优化的封装，用以修复时序。

iCTS的整体架构可以分为四层：

1. 控制流层
   iCTS是该点工具的控制流，控制iCTS各个功能模块的执行顺序
2. 功能模块层
   包含点工具的各个功能模块，也是点工具的核心层。
3. 适配层
4. 数据库层
   保存从def和lef文件中读取的各种数据。

### 2.2 软件流程

通过2.1节中的总体架构图我们对iCTS的整体框架有了点简单的了解，下面我们通过代码来更深层次的了解下iCTS的整体框架。
iCTS点工具的处理流程由icts命名空间下的CTS类的对象来控制。因此首先需要创建CTS类的对象。下面我们以1.4.2中单独运行的方式来讲述iCTS的代码流程。

1. 创建iCTS流程控制对象

```C++=
CTS (const string& confige_file) {
    _config = new CtsConfig();
    _db_wrapper = new CtsDBWrapper();
  
    JsonParser::get_instance().parse(config_file);
}

icts::CTS cts_flow("cts_config_file_name.json");
```

上面代码段的第1~6行是CTS类的单参构造函数的实现，该构造函数的参数是一个json文件的路径。构造函数首先创建一个 CtsConfig 类的对象，然后调用json解析器将配置文件中的内容读取到 CtsConfig 类的对象中。通过第7行的代码就可以构造一个iCTS的流程控制对象。

2. 启动iDB
   芯片设计的数据和工艺信息初始时是保存在def和lef文件中的，我们需要借助idb将数据从文件读取到内存中。为了使iCTS和iDB解耦我们对iDB封装了一层，CtsDBWrapper 类提供了对iDB功能的封装。因此启动idb读取def/lef文件中内容的功能可以使用下面1~2行的代码完成。

```C++=
_db_wrapper = new CtsDBwrapper();
_db_wrapper->readFile(_config);

CtsDBWrapper() { _idb = new IdbBuilder(); }

void readFile(CtsConfig *config) {
    auto lef_paths = config->get_input_lef_paths();
    auto def_path = config->get_input_def_path();

    _idb->buildLef(lef_paths);
    _idb->buildDef(def_path);

    _idb_design = _idb->get_def_service()->get_design();
    _idb_layout = _idb->get_lef_service()->get_layout();
}
```

第4行是CtsDBWraper类的无参构造函数，其作用是初始化一个iDB的对象作为CtsDBWrapper类对象的成员变量。第6~15行是CtsDBWrapper类对idb读取def和lef文件的封装。其参数config中保存有def和lef文件的路径信息。

3. 从iDB中读取iCTS所需数据

```C++
_db_wrapper->read(_config, _design);

void read(CtsConfig *config, CtsDesign *design);
```

CtsDesign类的对象用于保存从iDB中读取的数据以及时钟树相关的数据，可以视为iCTS的database。CtsConfig用于保存从idb中读取到的单位信息。

4. 构建时钟树

```C++
cts_flow.routing();

void routing() {
    Router router;
    router.init(_config, _design);
    router.build();
    router.update(_design);
}
```

Router类的对象提供构建时钟树的功能。Router::init 函数将CtsDesign类的对象中保存的数据转存到 Router 类的对象中。Router::build 函数通过算法构建时钟树。最后通过Router::update 函数将构建的时钟树保存到CtsDesign类的对象中。Router::build 函数所调用的构建时钟树的算法整个iCTS点工具的核心，后面会在讲述这部分。

5. 插buffer
   时钟树构建完成后需要选择某些节点并在这些节点所在的位置放置buffer以平衡延时和减小负载。这些功能都放在Synthesis类中。

```C++
cts_flow.routing();

void synthesis() {
    Synthesis synth;
    synth.init(_config, _design, _db_wrapper);
    synth.insertCtsNetlist();
    synth.update(_design);
}
```

6. 评估时序
   评估时序需要用到iSTA，因此要先启动iSTA。与iDB的启动类似，第4~5行的代码用于启动iSTA。STAWrapper类是对iSTA功能的封装。Evalutor::evaluate 函数会调用STAWrapper的时序评估功能。评估的结果会写入到CtsConfig.json文件所指定的iSTA的工作目录中。

```C++=
cts_flow.evaluate();

void CTS::evalate() {
    _sta_wrapper = new STAWrapper(_config, _db_wrapper);
    _sta_wrapper->readFile(_config);

    Evaluator evaluator(_sta_wrapper);
    evaluator.init(_config, _design);
    evaluator.evaluate();
    evaluator.wireLength();
}
```

7. 数据写回
   iCTS完成对应的功能后需要将数据写回到def文件中。CtsDBWraper类提供了对iDB写def文件操作的封装，直接调用即可。

```C++
cts_flow.writeDB();

void writeDB() { _db_wrapper->writeDef(_config); }
```

### 2.3 子模块设计

#### 2.3.1 polygon

iCTS的polygon模块包括一些基础数据结构和与这些数据结构相关的一些算法。这些基础的数据结构包括点、线段、区间、矩形、多边形。polygon模块实现了一些算法但是大部分与计算几何相关的算法来自boost polygon库。boost polygon库的算法支持用户自定义的数据结构，但在使用之前需要向boost polygon库注册你的数据结构。假设你有一个Point类，你可以通过下面的代码向boost polygon库注册你的Point类。
第10行和第22行说明Point类所使用的数据类型，get函数说明如何从Point中获取坐标值，set和consturct函数说明怎么给Point类设置值以及如何构造Point。iCTS中polygon模块的CtsPoint数据结构和boost polygon库的点数据结构有相同的接口，因此只需要第4-5行的代码就可以向boost polygon注册CtsPoint类了。其他数据结构的注册类似，详细的内容可以查看boost库的[官方文档](https://www.boost.org/doc/libs/1_67_0/libs/polygon/doc/index.htm)。

```C++=
namespace boost{
namespace polygon{

template <>
struct geometry_concept<Point> { typedef point_concept type; };

//Then we specialize the gtl point traits for our point type
template <>
struct point_traits<Point> {
    typedef int coordinate_type;

    static inline coordinate_type get(const Point& point,
    orientation_2d orient) {
        if(orient == HORIZONTAL)
            return point.x;
        return point.y;
    }
};

template <>
struct point_mutable_traits<Point> {
    typedef int coordinate_type;

    static inline void set(Point& point, orientation_2d orient, int value) {
        if(orient == HORIZONTAL)
            point.x = value;
        else
        point.y = value;
    }
    static inline Point construct(int x_value, int y_value) {
        Point retval;
        retval.x = x_value;
        retval.y = y_value;
        return retval;
    }
};

}
}
```

#### 2.3.2 clustering

给定一个平面点集，聚类算法可以使距离较近的一些点归为一类，从而对点集实现分类的功能。布局后的时钟源所驱动的每个时序单元都有一个具体的坐标。通过聚类算法可以实现对时序单元分类的功能。下面介绍下效率比较高的kmeans算法的过程：

1. 随机初始化k个点作为簇质心；
2. 将样本集中的每个点分配到一个簇中；计算每个点与质心之间的距离，并将其分配给距离最近的质心所对应的簇中；
3. 更新簇的质心。每个簇的质心更新为该簇所有点的平均值；
4. 反复迭代2-3步骤，直到达到某个终止条件；常用的终止条件有：1）达到指定的迭代次数；2）簇心不再发生明显的变化，即收敛；

> 其中步骤2中的距离要使用曼哈顿距离。曼哈顿距离是水平和垂直偏移量的绝对值之和, 即 distance = |$x_1 - x_2$| + |$y_1 - y_2$|。
> 聚类算法的结果要传给构建拓扑模块，因此当上述算法产生大小为0的聚类时要将这种结果排除在外。
> 当某些聚类（cluster）的大小超过预先设置的上界值，则需要对这个较大的聚类（cluster）重新聚类(clustering)。

下面是kmeans的代码框架。

```C++=
template <typename Value>
vector<vector<Value>> kmeans(const vector<Value> &points, int cluster_size) {
    init(points, cluster_size);
  
    bool stop_flag = true;
    while (stop_flag) {
        partition_point();

        vector<pair<double, double>> center_coords(_cluster_num);
        compute_center_coords(center_coords);

        stop_flag = update_center_coords(center_coords);
    }

    vector<vector<Value>> clusters(_cluster_num);
    for (auto &cluster_point : _cluster_points) {
        auto index = cluster_point.get_index();
        auto value = cluster_point.get_value();
        clusters[index].push_back(value);
    }

    auto remove_rule = [](auto &cluster) { return cluster.size() == 0; };
    clusters.erase(std::remove_if(clusters.begin(), clusters.end(), remove_rule), clusters.end());

    return clusters;
}
```

#### 2.3.3 Topology

构建时钟树分为两步：第一步构建一个拓扑，第二步是确定拓扑中节点的位置。
下图是一个树形拓扑。我们以构建树形拓扑为例阐述拓扑的构建。在开始时只有$s_1$、$s_2$、$s_3$、$s_4$四个点。$s_1$、$s_2$被选中归并为$x$节点，随后$s_3$、$s_4$被选中归并为$y$节点。最后由$x、y$归并为根节点$z$,当只有一个节点时拓扑树的构建结束。

 ![TJONvNr.png](https://images.gitee.com/uploads/images/2022/0616/201413_2ce9078b_8138284.png)

一个简单的拓扑构建算法的框架如下：

1. 初始化 令$K = S$, $S$是一个点集
2. 如果 $|K|=1$, 则停止。否则的话从K中选择最近的点对$(v1, v2)$。
3. 根据$(v_1, v_2)$计算新的节点$v$, 然后从$K$中删除$v_1、v_2$并将$v$添加到$K$。

> 集合$K$可以是一个点集也可以改为点和线段的集合，或者点、线段、多边形的集合。
> 从集合K中被选择的元素可以通过不同的选择规则来选取。
> 可以从根据集合$K$构建的最近邻接图中一次选择$K/k$个最近临界对(k是常量)，详细请参考[论文](https://ieeexplore.ieee.org/document/1600293)。

#### 2.3.4 Insert buffer

假定现在时钟树已经被构建（时钟树构建算法在后面讲述）。接下来就要将时钟树中的某些节点插入buffer。在构建时钟树后时钟树的每个节点都有一个精确的位置。Insert buffer的工作就是创建一个新的buffer并在版图中为buffer选择一个距离被插入的时钟树节点最近的空闲位置。可以放置buffer的空间由多个行组成，每个行由多个列组成。为buffer寻找可以放置的空闲位置可以抽象为在一个含有障碍物的网格图中寻找一些空闲的网格。下图由五行组成，黄色矩形是单元的外接矩形，每个单元占据多个列。



 ![sADzQuh.png](https://images.gitee.com/uploads/images/2022/0616/201531_499fc47d_8138284.png)
放置buffer的代码如下所示。
buffer由CtsInstance类的对象表示，第1行通过CtsDBWrapper对象的get_bounding_box方法获取buffer的外接矩形。因为buffer有不同的类型每种类型的外接矩形的大小都不一样，不同buffer大小的信息存在lef中，因此可以借助iDB来获取buffer的外接矩形。findPlacedLocation函数会从网格图中寻找一个空闲的位置。第9行设置buffer的坐标。第12行把第6行返回的空闲位置设置为障碍物。findPlacedLocation函数是通过广度优先搜索遍历网格图来实现的。

```C++=
void Placer::placeInstance(CtsInstance *inst) {
    // get the bounding box of instance
    Rectangle inst_bounding_box = _db_wrapper->get_bounding_box(inst);

    // find suitable location in grid coordination
    auto new_bounding_box = findPlacedLocation(inst_bounding_box);

    // place instance to suitable location
    inst->set_location(Point(gtl::xl(new_bounding_box), gtl::yl(new_bounding_box)));

    // set blocakage to grid graph
    setBlockage(new_bounding_box);
}
```

#### 2.3.5 评估时序

iCTS中的时序评估是通过调用iSTA来实现的。iSTA内部通过RCTree来保存要评估的数据。因此调用iSTA评估时序的主要工作是通过iSTA提供的接口来构建RCTree, 然后调用reportTiming函数来报告时序。下面的代码展示了如何调用iSTA提供的接口来为一条net构建RCTree。
第1行获取被评估net的所有节点之间的连线。第3-4行获取线段的两个端点。第10-16行通过makeOrFindRCTreeNode函数来获取一个RCTree中的节点（无则创建新的节点，有则返回原来的节点）。第27~28根据线长从iSTA提供的接口获取节点电容和电阻。第29-31行设置节点的电容电阻。

```C++=
auto signal_wires = eval_net.get_signal_wires();
for (auto &signal_wire : signal_wires) {
    auto epl = signal_wire.get_first();
    auto epr = signal_wire.get_second();

    pcl::RctNode *front_node = nullptr;
    pcl::RctNode *back_node = nullptr;
    auto *        inst_l = eval_net.get_instance(epl._name);
    auto *        inst_r = eval_net.get_instance(epr._name);
    if (inst_l == nullptr) {
        front_node = _timing_engine->makeOrFindRCTreeNode(sta_net, std::stoi(epl._name));
    } else {
        auto *pin = inst_l->get_out_pin();
        auto *pin_port = netlist->findObj(pin->get_full_name().c_str(), false, false).front();
        front_node = _timing_engine->makeOrFindRCTreeNode(pin_port);
    }
    if (inst_r == nullptr) {
        back_node = _timing_engine->makeOrFindRCTreeNode(sta_net, std::stoi(epr._name));
    } else {
        auto *pin = inst_r->get_load_pin();
        auto *pin_port = netlist->findObj(pin->get_full_name().c_str(), false, false).front();
        back_node = _timing_engine->makeOrFindRCTreeNode(pin_port);
    }

    std::optional<double> width = std::nullopt;
    auto   wire_length = (double)signal_wire.get_wire_length() / _config->get_micron_dbu();
    double cap = sta_db_adapter->getCapacitance(1, wire_length, width);
    double res = sta_db_adapter->getResistance(1, wire_length, width);
    _timing_engine->makeResistor(sta_net, front_node, back_node, res);
    _timing_engine->incrCap(front_node, cap / 2);
    _timing_engine->incrCap(back_node, cap / 2);
}
```

### 2.4 评价指标

* **skew**: skew对setup和hold都有影响。如果两个需要进行hold check的单元存在较大的skew，那么hold violation就会比较大。
* **latency**: clock inverter更少，clock tree上的功耗更小，占用更少的布线以及更容易timing signoff。

### 2.5 算法设计

iCTS主要的功能是构建时钟树，因此构建时钟树的算法是iCTS中的主要算法。目前iCTS采用DME算法来构建时钟树。DME算法可以分为以下三种：

* ZST (zero skew tree)
* BST (bounded skew tree)
* UST (useful skew tree)

DME算法的输入是一个固定的拓扑。拓扑中叶子节点的位置是已知的，DME算法会根据叶子节点的位置来确定各个内部节点的位置。确定内部节点确切位置的过程可以分为两步。第一步自底向上计算拓扑中每个节内部节点所有可行的位置，第二步自顶向下从每个内部节点的可行的位置中选择一个确切的位置。
ZST算法会构建一个0skew的时钟树，BST算法所构建的时钟树允许有一定的skew, 但是该skew会小于设定的skew上界。ZST和BST算法的差异主要是可行位置所形成的图形不同。下图中的做图和右图分别是ZST和BST算法的例子。从下图中的左图可以看到$s_1、s_2$节点所有可行位置形成一个$45^o$的线段，而下图中的右图$s_1、s_2$节点所有可行位置形成一个多边形。
![](https://i.imgur.com/UPT54lA.png)


下面介绍ZST算法如何根据两个子节点$v_1、v_2$确定其父节归并段（所有可行位置）的过程。在此之前需要明确下曼哈顿弧的概念。曼哈顿弧是一个切斜的$45^o$或$135^o$的线段。距离曼哈顿弧距离（曼哈顿距离）相等的各个点会形成一个倾斜的矩形。计算父节点归并段的过程如下：

1. 计算两个子节点归并段之间的曼哈顿距离(dist)
2. 计算两个子节点对应的边长(dist/2)
3. 根据边长计算两个子节点的归并段对应的倾斜矩形
4. 两个子节点归并段的交集作为父节点的归并段
   ![](https://i.imgur.com/6XwnQMQ.png)

ZST算法构建一颗时钟树的伪代码如下图所示：
![](https://i.imgur.com/2fS0t6t.png)

算法的详细内容请见[ZST论文](http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.460.1106&rep=rep1&type=pdf)和[BST论文](https://dl.acm.org/doi/10.1145/293625.293628)

### 2.6 数据结构设计

> 描述用到的主要数据结构，包括类的设计，继承关系等等。

## 3. 接口设计

### 3.1 外部接口

下面的函数是CTS类的成员函数, 该函数返回iCTS修改后的时钟net以及时钟net对应的期望布线结果。

```C++
vector<pair<IdbNet *, vector<CtsSignalWire>>> CTS::get_clock_nets();
```

### 3.2 内部接口

功能：以inst所指对象的位置为中心，寻找距离中心最近的空闲空间
参数：CtsInstance类的指针
返回值：无

```C++
void Placer::placeInstance(CtsInstance *inst) ;
```

功能：读取指定json文件中的内容并将其保存到config指针所指的对象中
参数：json_file 被读取json文件的路径， config 指向CtsConfig类的指针
返回值：无

```C++
void JsonParser::parse(const string &json_file, CtsConfig *config) const;
```

功能：向gds文件中输出一些多边形
参数：polys 多边形的集合

```C++
template <typename Polygon>
void GDSPloter::plotPolygons(vector<Polygon> &polys);
```

功能：根据被评估net中的线段信息构建RCTree
参数：eval_net 被评估的net

```C++
void STAWrapper::buildRCTree(const EvalNet &eval_net);
```

功能：对输入的集合聚类
参数：points 需要被聚类的集合，cluster_size 聚类的期望大小

```C++
vector<vector<Value>> operator()(const vector<Value> &points, int cluster_size);
```

## 4. 测试报告

### 4.1 测试环境

目前采用一生一芯的设计进行测试，通过检测输出的版图中是否有bufffer位置的重叠来检测是否有错误产生。通过时序报告可以检测结果的好坏。

### 4.2 测试结果

> 描述测试人员应该覆盖的功能点

| **测试****编号** | **测试****版本** | **测试功能点** | **测试****描述** |
| ---------------------- | ---------------------- | -------------------- | ---------------------- |
| TR01                   | V1.0                   |                      |                        |
| …                     | …                     | …                   | …                     |

### 4.3 比对

商业工具时钟树综合后的结果
![cadence](https://i.imgur.com/FJVRGUe.png)
iCTS综合后的结果
![](https://i.imgur.com/Qq6wsHC.png)
上面两幅图分别描述了商业EDA工具和iCTS点工具时钟树综合后的skew结果对比。可以看出虽然skew比较小但和商业EDA工具还是有差距的。因为iCTS是使用的开源EDA中的布局工具给出的结果，而布局的结果对时钟树综合也会有影响。如果采用商业EDA的布局结果，iCTS综合后的结果可能会更好一点。

## 5. TO BE DONE

### 5.1 疑难问题

在开发中比较难处理的问题是BST算法中根据子节点的归并区计算父节点的归并区。计算的过程中会涉及多边形的交集等操作，而这些操作一般不支持浮点数会导致计算的中间结果取整损失了精度。比较好的解决方法是在计算之前将数据放大用大整数代替浮点数的运算。此外为了尽量避免使用乘法以防止进行浮点数运算时损失精度，需要改进算法。

### 5.2 待研究

目前iCTS只考虑了零skew和有界skew的算法，后续需要考虑实现useful skew算法。此外wire size优化，多时钟问题都有待研究。
